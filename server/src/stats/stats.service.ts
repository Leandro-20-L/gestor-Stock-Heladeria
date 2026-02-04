import { Injectable } from '@nestjs/common';

import { Venta, VentaDocument } from 'src/ventas/schemas/venta.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

type ResumenParams = { from?: string; to?: string };
type CreatedAtRange = { $gte?: Date; $lte?: Date };
type VentaMatch = {
  createdAt?: CreatedAtRange;
  estado?: 'confirmada' | 'anulada';
};

type TotalesAggRow = {
  _id: 'confirmada' | 'anulada';
  total: number;
  cantidad: number;
};

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Venta.name)
    private readonly ventaModel: Model<VentaDocument>,
  ) {}

  remove(id: number) {
    return `This action removes a #${id} stat`;
  }

  async resumen(params: ResumenParams) {
    const match: VentaMatch = {};

    // Rango por createdAt si viene
    if (params.from || params.to) {
      match.createdAt = {};
      if (params.from) {
        match.createdAt.$gte = new Date(params.from + 'T00:00:00.000Z');
      }
      if (params.to) {
        match.createdAt.$lte = new Date(params.to + 'T23:59:59.999Z');
      }
    }

    // 1) Totales (confirmadas/anuladas)
    const totalesAgg = await this.ventaModel.aggregate<TotalesAggRow>([
      { $match: match },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    let totalFacturado = 0;
    let cantidadConfirmadas = 0;
    let cantidadAnuladas = 0;

    for (const row of totalesAgg) {
      if (row._id === 'confirmada') {
        totalFacturado = row.total ?? 0;
        cantidadConfirmadas = row.cantidad ?? 0;
      } else if (row._id === 'anulada') {
        cantidadAnuladas = row.cantidad ?? 0;
      }
    }

    // 2) Por medio de pago (solo confirmadas)
    const porMedioPago = await this.ventaModel.aggregate([
      { $match: { ...match, estado: 'confirmada' } },
      {
        $group: {
          _id: '$medioPago',
          total: { $sum: '$total' },
          cantidad: { $sum: 1 },
        },
      },
      { $project: { _id: 0, medio: '$_id', total: 1, cantidad: 1 } },
      { $sort: { total: -1 } },
    ]);

    // 3) Por día (solo confirmadas)
    const porDia = await this.ventaModel.aggregate([
      { $match: { ...match, estado: 'confirmada' } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: '$total' },
          cantidad: { $sum: 1 },
        },
      },
      { $project: { _id: 0, fecha: '$_id', total: 1, cantidad: 1 } },
      { $sort: { fecha: 1 } },
    ]);

    // 4) Top productos (solo confirmadas) — usa nombreSnapshot
    const topProductos = await this.ventaModel.aggregate([
      { $match: { ...match, estado: 'confirmada' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.nombreSnapshot',
          cantidad: { $sum: '$items.cantidad' },
          total: { $sum: '$items.subtotal' },
        },
      },
      { $project: { _id: 0, nombre: '$_id', cantidad: 1, total: 1 } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    return {
      rango: { from: params.from ?? null, to: params.to ?? null },
      totalFacturado,
      cantidadConfirmadas,
      cantidadAnuladas,
      porMedioPago,
      porDia,
      topProductos,
    };
  }
}
