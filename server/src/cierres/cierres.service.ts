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
import { Venta, VentaDocument } from 'src/ventas/schemas/venta.schema';

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
    @InjectModel(Venta.name) private ventaModel: Model<VentaDocument>,
  ) {}
  async create(dto: CreateCierreDto) {
    const existente = await this.cierreModel
      .findOne({ fecha: dto.fecha })
      .exec();

    if (existente) {
      throw new BadRequestException(`Ya existe un cierre para ${dto.fecha}`);
    }

    const inputItems = dto.items ?? [];

    const ids = inputItems.map((i) => new Types.ObjectId(i.productoId));

    const productos = await this.productoModel
      .find({ _id: { $in: ids } })
      .select({ _id: 1, stockActual: 1 })
      .lean<ProductoMin[]>()
      .exec();

    const mapProd = new Map<string, ProductoMin>();

    for (const p of productos) {
      mapProd.set(String(p._id), p);
    }

    const itemsFinal = inputItems.map((i) => {
      const prod = mapProd.get(i.productoId);

      if (!prod) {
        throw new NotFoundException(`Producto no encontrado: ${i.productoId}`);
      }

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

    const totalEfectivoSistema = Number(dto.totalEfectivoSistema ?? 0);
    const totalTransferenciaSistema = Number(
      dto.totalTransferenciaSistema ?? 0,
    );
    const totalPointSistema = Number(dto.totalPointSistema ?? 0);

    const totalVentasTeorico = Number(
      dto.totalVentasTeorico ??
        totalEfectivoSistema + totalTransferenciaSistema + totalPointSistema,
    );

    const efectivoContado = Number(
      dto.efectivoContado ?? dto.totalCajaContada ?? 0,
    );

    const diferenciaEfectivo = Number(
      dto.diferenciaEfectivo ?? efectivoContado - totalEfectivoSistema,
    );

    const totalCajaContada = efectivoContado;

    const diferenciaCaja = Number(dto.diferenciaCaja ?? diferenciaEfectivo);

    const cierre = await this.cierreModel.create({
      fecha: dto.fecha,
      usuarioId: dto.usuarioId ? new Types.ObjectId(dto.usuarioId) : undefined,

      items: itemsFinal,
      totalProductos: itemsFinal.length,
      conDiferencias,

      totalVentasTeorico,
      totalCajaContada,
      diferenciaCaja,

      totalEfectivoSistema,
      totalTransferenciaSistema,
      totalPointSistema,
      efectivoContado,
      diferenciaEfectivo,
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
