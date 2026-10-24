import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVentaDto } from './dto/create-venta.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Venta } from './entities/venta.entity';
import {
  Producto,
  ProductoDocument,
} from 'src/productos/schemas/producto.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { VentaDocument } from './schemas/venta.schema';

@Injectable()
export class VentasService {
  constructor(
    @InjectModel(Venta.name) private readonly ventaModel: Model<VentaDocument>,
    @InjectModel(Producto.name)
    private readonly productoModel: Model<ProductoDocument>,
  ) {}

  async create(dto: CreateVentaDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('La venta debe tener items');
    }

    const idsProductosUnicos = new Set<string>();

    for (const it of dto.items) {
      const id = (it.productoId || '').trim();

      if (!isValidObjectId(id)) {
        throw new BadRequestException(`ProductoId inválido: ${it.productoId}`);
      }

      if (it.cantidad < 1) {
        throw new BadRequestException(`La cantidad debe ser mayor a 0`);
      }

      idsProductosUnicos.add(id);

      // Validar IDs de agregados si existen
      for (const ag of it.agregados ?? []) {
        if (!isValidObjectId(ag.productoId)) {
          throw new BadRequestException(
            `ID de agregado inválido: ${ag.productoId}`,
          );
        }
      }
    }

    const ids = Array.from(idsProductosUnicos).map(
      (id) => new Types.ObjectId(id),
    );

    const productos = await this.productoModel
      .find({ _id: { $in: ids }, activo: true })
      .exec();

    if (productos.length !== ids.length) {
      throw new NotFoundException(
        'Uno o más productos no existen o están inactivos',
      );
    }

    const mapProductos = new Map<string, ProductoDocument>();
    for (const p of productos) {
      mapProductos.set(p._id.toString(), p);
    }

    /*
      descuentosStock:
      key = ID del producto/insumo que realmente se descuenta
      value = cantidad total a descontar
    */
    const descuentosStock = new Map<string, number>();

    for (const it of dto.items) {
      const p = mapProductos.get(it.productoId.trim())!;
      const cantidadVendida = Number(it.cantidad);
      const excluidos = new Set(
        (it.insumosExcluidos ?? []).map((id) => id.trim()),
      );

      // 1. Receta base (ignorando los insumos excluidos como "Sin papas")
      if (p.descuentaStock?.length) {
        for (const d of p.descuentaStock) {
          const idStock = d.productoId.toString();

          if (excluidos.has(idStock)) {
            continue; // El cliente pidió sin este insumo, no se descuenta
          }

          const cantidadADescontar = Number(d.cantidad) * cantidadVendida;
          descuentosStock.set(
            idStock,
            (descuentosStock.get(idStock) ?? 0) + cantidadADescontar,
          );
        }
      } else {
        // Producto que descuenta su propio stock directamente
        const idStock = p._id.toString();
        descuentosStock.set(
          idStock,
          (descuentosStock.get(idStock) ?? 0) + cantidadVendida,
        );
      }

      // 2. Insumos agregados extra (ej: +1 Medallón para doble/triple)
      for (const ag of it.agregados ?? []) {
        const idExtra = ag.productoId.trim();
        const cantidadExtra = Number(ag.cantidad) * cantidadVendida;

        descuentosStock.set(
          idExtra,
          (descuentosStock.get(idExtra) ?? 0) + cantidadExtra,
        );
      }
    }

    const idsStock = Array.from(descuentosStock.keys()).map(
      (id) => new Types.ObjectId(id),
    );

    const productosStock = await this.productoModel
      .find({ _id: { $in: idsStock }, activo: true })
      .exec();

    if (productosStock.length !== idsStock.length) {
      throw new NotFoundException(
        'Uno o más insumos/productos de stock no existen o están inactivos',
      );
    }

    const mapProductosStock = new Map<string, ProductoDocument>();
    for (const ps of productosStock) {
      mapProductosStock.set(ps._id.toString(), ps);
    }

    // Verificar disponibilidad de stock antes de descontar
    for (const p of productosStock) {
      const requerido = descuentosStock.get(p._id.toString()) ?? 0;
      const disponible = p.stockActual ?? 0;

      if (disponible < requerido) {
        throw new BadRequestException(
          `Stock insuficiente para "${p.nombre}" (disp: ${disponible}, req: ${requerido})`,
        );
      }
    }

    // Armar snapshot de cada renglón vendido
    const itemsSnapshot = dto.items.map((it) => {
      const p = mapProductos.get(it.productoId.trim())!;
      const cantidad = Number(it.cantidad);
      const recargo = Number(it.recargoUnitario ?? 0);

      const precioBase =
        dto.medioPago === 'point' && p.precioPoint != null
          ? p.precioPoint
          : (p.precioVenta ?? 0);

      const precioUnitario = precioBase + recargo;

      // Sumamos también el costo de los agregados extra si tienen costo cargado
      const costoExtras = (it.agregados ?? []).reduce((acc, ag) => {
        const insumoDoc = mapProductosStock.get(ag.productoId.trim());
        return acc + (insumoDoc?.costo ?? 0) * Number(ag.cantidad);
      }, 0);

      const costoUnitario = (p.costo ?? 0) + costoExtras;
      const subtotal = precioUnitario * cantidad;
      const gananciaSnapshot = (precioUnitario - costoUnitario) * cantidad;

      const agregadosSnapshot = (it.agregados ?? []).map((ag) => {
        const insumoDoc = mapProductosStock.get(ag.productoId.trim());
        return {
          productoId: new Types.ObjectId(ag.productoId.trim()),
          nombreSnapshot: insumoDoc?.nombre ?? 'Agregado',
          cantidad: Number(ag.cantidad),
        };
      });

      const excluidosIds = (it.insumosExcluidos ?? []).map(
        (id) => new Types.ObjectId(id.trim()),
      );

      return {
        productoId: p._id,
        nombreSnapshot: it.notaModificadores
          ? `${p.nombre} (${it.notaModificadores})`
          : p.nombre,
        precioUnitarioSnapshot: precioUnitario,
        costoUnitarioSnapshot: costoUnitario,
        cantidad,
        subtotal,
        gananciaSnapshot,
        insumosExcluidos: excluidosIds,
        agregados: agregadosSnapshot,
        notaModificadores: it.notaModificadores ?? '',
      };
    });

    const total = itemsSnapshot.reduce((acc, it) => acc + it.subtotal, 0);
    const gananciaTotal = itemsSnapshot.reduce(
      (acc, it) => acc + it.gananciaSnapshot,
      0,
    );

    // Ejecutar descuentos en MongoDB
    for (const [idStock, cantidad] of descuentosStock.entries()) {
      await this.productoModel
        .updateOne(
          { _id: new Types.ObjectId(idStock) },
          { $inc: { stockActual: -cantidad } },
        )
        .exec();
    }

    return this.ventaModel.create({
      items: itemsSnapshot,
      total,
      gananciaTotal,
      medioPago: dto.medioPago,
      estado: 'confirmada',
    });
  }

  findAll() {
    return this.ventaModel.find().sort({ createdAt: -1 }).exec();
  }

  findOne(id: string) {
    return this.ventaModel.findById(id.trim()).exec();
  }

  remove(id: number) {
    return `This action removes a #${id} venta`;
  }

  async anular(id: string) {
    const venta = await this.ventaModel.findById(id).exec();

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (venta.estado === 'anulada') {
      throw new BadRequestException('La venta ya está anulada');
    }

    const idsProductosVendidos = venta.items.map(
      (it) => new Types.ObjectId(it.productoId),
    );

    const productosVendidos = await this.productoModel
      .find({ _id: { $in: idsProductosVendidos } })
      .exec();

    const mapProductos = new Map<string, ProductoDocument>();
    for (const p of productosVendidos) {
      mapProductos.set(p._id.toString(), p);
    }

    const reposicionesStock = new Map<string, number>();

    for (const item of venta.items as any[]) {
      const producto = mapProductos.get(item.productoId.toString());

      if (!producto) {
        throw new NotFoundException(
          `Producto no encontrado para reponer stock: ${item.productoId}`,
        );
      }

      const cantidadVendida = Number(item.cantidad);
      const excluidos = new Set(
        (item.insumosExcluidos ?? []).map((id: any) => id.toString()),
      );

      // 1. Reponer receta base (salvo los que habían sido excluidos)
      if (producto.descuentaStock?.length) {
        for (const d of producto.descuentaStock) {
          const idStock = d.productoId.toString();
          if (excluidos.has(idStock)) continue;

          const cantidadAReponer = Number(d.cantidad) * cantidadVendida;
          reposicionesStock.set(
            idStock,
            (reposicionesStock.get(idStock) ?? 0) + cantidadAReponer,
          );
        }
      } else {
        const idStock = producto._id.toString();
        reposicionesStock.set(
          idStock,
          (reposicionesStock.get(idStock) ?? 0) + cantidadVendida,
        );
      }

      // 2. Reponer los agregados extra que tenía este ítem
      for (const ag of item.agregados ?? []) {
        const idExtra = ag.productoId.toString();
        const cantidadExtra = Number(ag.cantidad) * cantidadVendida;

        reposicionesStock.set(
          idExtra,
          (reposicionesStock.get(idExtra) ?? 0) + cantidadExtra,
        );
      }
    }

    for (const [idStock, cantidad] of reposicionesStock.entries()) {
      await this.productoModel
        .updateOne(
          { _id: new Types.ObjectId(idStock) },
          { $inc: { stockActual: cantidad } },
        )
        .exec();
    }

    venta.estado = 'anulada';
    await venta.save();

    return {
      message: 'Venta anulada y stock repuesto',
      id: venta.id,
      estado: venta.estado,
      reposiciones: Array.from(reposicionesStock.entries()).map(
        ([productoId, cantidad]) => ({
          productoId,
          cantidad,
        }),
      ),
    };
  }

  async totalConfirmadasPorDia(fecha: string): Promise<number> {
    const from = new Date(`${fecha}T00:00:00.000Z`);
    const to = new Date(`${fecha}T23:59:59.999Z`);

    const res = await this.ventaModel.aggregate<{ total: number }>([
      {
        $match: {
          estado: 'confirmada',
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
        },
      },
    ]);

    return res[0]?.total ?? 0;
  }
}