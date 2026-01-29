import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCierreDto } from './dto/create-cierre.dto';

import { Cierre } from './entities/cierre.entity';
import {
  Producto,
  ProductoDocument,
} from 'src/productos/schemas/producto.schema';
import { Model, Types } from 'mongoose';
import { CierreDocument } from './schemas/cierre.schema';
import { InjectModel } from '@nestjs/mongoose';

type ProductoMin = {
  _id: Types.ObjectId;
  stockActual: number;
};

@Injectable()
export class CierresService {
  constructor(
    @InjectModel(Cierre.name)
    private readonly cierreModel: Model<CierreDocument>,
    @InjectModel(Producto.name)
    private readonly productoModel: Model<ProductoDocument>,
  ) {}
  async create(dto: CreateCierreDto) {
    const existente = await this.cierreModel
      .findOne({ fecha: dto.fecha })
      .exec();
    if (existente)
      throw new BadRequestException(`Ya existe un cierre para ${dto.fecha}`);

    const ids = dto.items.map((i) => new Types.ObjectId(i.productoId));

    // ✅ lean() + tipado mínimo
    const productos = await this.productoModel
      .find({ _id: { $in: ids } })
      .select({ _id: 1, stockActual: 1 })
      .lean<ProductoMin[]>()
      .exec();

    // ✅ Map tipado
    const mapProd = new Map<string, ProductoMin>();
    for (const p of productos) mapProd.set(String(p._id), p);

    const itemsFinal = dto.items.map((i) => {
      const prod = mapProd.get(i.productoId); // ✅ ya no es any
      if (!prod)
        throw new NotFoundException(`Producto no encontrado: ${i.productoId}`);

      const stockTeorico = Number(prod.stockActual ?? 0);
      const stockContado = Number(i.stockContado);
      const diferencia = stockContado - stockTeorico;

      return {
        productoId: new Types.ObjectId(i.productoId),
        stockTeorico,
        stockContado,
        diferencia,
      };
    });

    const conDiferencias = itemsFinal.filter((x) => x.diferencia !== 0).length;

    const cierre = await this.cierreModel.create({
      fecha: dto.fecha,
      usuarioId: dto.usuarioId ? new Types.ObjectId(dto.usuarioId) : undefined,
      items: itemsFinal,
      totalProductos: itemsFinal.length,
      conDiferencias,
    });

    return cierre;
  }

  findAll(fecha?: string) {
    const filter: { fecha?: string } = {};
    if (fecha) filter.fecha = fecha;

    return this.cierreModel.find(filter).sort({ fecha: -1 }).exec();
  }

  async findOne(id: string) {
    const cierre = await this.cierreModel
      .findById(id)
      .populate('items.productoId', 'nombre unidad')
      .exec();
    if (!cierre) throw new NotFoundException('Cierre no encontrado');
    return cierre;
  }
}
