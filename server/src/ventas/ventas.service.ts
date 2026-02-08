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
    //evita crear ventas vacias
    if (!dto.items?.length)
      throw new BadRequestException(`La venta debe tener items`);
    //estructura nombre: helado cantidad: 3
    const map = new Map<string, number>();
    for (const it of dto.items) {
      const id = (it.productoId || '').trim();
      if (!isValidObjectId(id))
        throw new BadRequestException(`ProductoId invalido: ${it.productoId}`);
      map.set(id, (map.get(id) ?? 0) + it.cantidad);
    }

    //Convierte los IDs string → ObjectId
    const ids = Array.from(map.keys()).map((id) => new Types.ObjectId(id));
    //trae productos que esten activos y que existan
    const productos = await this.productoModel
      .find({ _id: { $in: ids }, activo: true })
      .exec();

    if (productos.length !== ids.length) {
      throw new NotFoundException(
        `Uno o mas productos no existen o estan inactivos`,
      );
    }

    // Validar stock
    for (const p of productos) {
      const qty = map.get(p._id.toString()) ?? 0;
      if ((p.stockActual ?? 0) < qty) {
        throw new BadRequestException(
          `Stock insuficiente para "${p.nombre}" (disp: ${p.stockActual}, req: ${qty})`,
        );
      }
    }

    // Armar items snapshot + total
    const itemsSnapshot = productos.map((p) => {
      const cantidad = map.get(p._id.toString())!;
      const precio = p.precioVenta ?? 0;
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

    // Descontar stock (secuencial, MVP)
    for (const p of productos) {
      const cantidad = map.get(p._id.toString())!;
      await this.productoModel
        .updateOne({ _id: p._id }, { $inc: { stockActual: -cantidad } })
        .exec();
    }

    // Guardar venta
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
