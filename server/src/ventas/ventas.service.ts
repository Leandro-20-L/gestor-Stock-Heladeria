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

    const map = new Map<string, number>();

    for (const it of dto.items) {
      const id = (it.productoId || '').trim();

      if (!isValidObjectId(id)) {
        throw new BadRequestException(`ProductoId inválido: ${it.productoId}`);
      }

      if (it.cantidad < 1) {
        throw new BadRequestException(`La cantidad debe ser mayor a 0`);
      }

      map.set(id, (map.get(id) ?? 0) + it.cantidad);
    }

    const ids = Array.from(map.keys()).map((id) => new Types.ObjectId(id));

    const productos = await this.productoModel
      .find({ _id: { $in: ids }, activo: true })
      .exec();

    if (productos.length !== ids.length) {
      throw new NotFoundException(
        'Uno o más productos no existen o están inactivos',
      );
    }

    /*
    descuentosStock:
    key = ID del producto/insumo que realmente se descuenta
    value = cantidad total a descontar
  */
    const descuentosStock = new Map<string, number>();

    for (const p of productos) {
      const cantidadVendida = map.get(p._id.toString()) ?? 0;

      if (p.descuentaStock?.length) {
        for (const d of p.descuentaStock) {
          const idStock = d.productoId.toString();
          const cantidadADescontar = Number(d.cantidad) * cantidadVendida;

          descuentosStock.set(
            idStock,
            (descuentosStock.get(idStock) ?? 0) + cantidadADescontar,
          );
        }
      } else {
        const idStock = p._id.toString();

        descuentosStock.set(
          idStock,
          (descuentosStock.get(idStock) ?? 0) + cantidadVendida,
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
        'Uno o más productos de stock no existen o están inactivos',
      );
    }

    for (const p of productosStock) {
      const requerido = descuentosStock.get(p._id.toString()) ?? 0;
      const disponible = p.stockActual ?? 0;

      if (disponible < requerido) {
        throw new BadRequestException(
          `Stock insuficiente para "${p.nombre}" (disp: ${disponible}, req: ${requerido})`,
        );
      }
    }

    const itemsSnapshot = productos.map((p) => {
      const cantidad = map.get(p._id.toString()) ?? 0;

      const precio =
        dto.medioPago === 'point' && p.precioPoint != null
          ? p.precioPoint
          : (p.precioVenta ?? 0);

      const subtotal = precio * cantidad;

      return {
        productoId: p._id,
        nombreSnapshot: p.nombre,
        precioUnitarioSnapshot: precio,
        cantidad,
        subtotal,
      };
    });

    const total = itemsSnapshot.reduce((acc, it) => acc + it.subtotal, 0);

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
    if (!venta) throw new NotFoundException('Venta no encontrada');

    if (venta.estado === 'anulada') {
      throw new BadRequestException('La venta ya está anulada');
    }

    venta.estado = 'anulada';
    await venta.save();

    return {
      message: 'Venta anulada',
      id: venta.id,
      estado: venta.estado,
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
