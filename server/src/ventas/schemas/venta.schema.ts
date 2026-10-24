import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VentaDocument = Venta & Document;

export type MedioPago = 'efectivo' | 'transferencia' | 'point';

@Schema({ _id: false })
export class VentaAgregado {
  @Prop({ type: Types.ObjectId, ref: 'Producto', required: true })
  productoId: Types.ObjectId;

  @Prop({ required: true })
  nombreSnapshot: string;

  @Prop({ required: true, min: 0.001 })
  cantidad: number;
}
export const VentaAgregadoSchema = SchemaFactory.createForClass(VentaAgregado);

@Schema({ _id: false })
export class VentaItem {
  @Prop({ type: Types.ObjectId, ref: 'Producto', required: true })
  productoId: Types.ObjectId;

  @Prop({ required: true })
  nombreSnapshot: string;

  @Prop({ required: true, min: 0 })
  precioUnitarioSnapshot: number;

  @Prop({ required: true, min: 1 })
  cantidad: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0, default: 0 })
  costoUnitarioSnapshot: number;

  @Prop({ required: true, default: 0 })
  gananciaSnapshot: number;

  // IDs de insumos de la receta original que NO se descontaron (ej: "Sin papas")
  @Prop({ type: [Types.ObjectId], ref: 'Producto', default: [] })
  insumosExcluidos: Types.ObjectId[];

  // Insumos extra sumados en esta venta (ej: +1 Medallón para hacerla doble)
  @Prop({ type: [VentaAgregadoSchema], default: [] })
  agregados: VentaAgregado[];

  // Texto resumen (ej: "Sin: Papas | Extra: +1 Medallón")
  @Prop({ required: false, default: '' })
  notaModificadores?: string;
}
export const VentaItemSchema = SchemaFactory.createForClass(VentaItem);

@Schema({ timestamps: true })
export class Venta {
  @Prop({ type: [VentaItemSchema], required: true })
  items: VentaItem[];

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ required: true, enum: ['efectivo', 'transferencia', 'point'] })
  medioPago: MedioPago;

  @Prop({
    required: true,
    enum: ['confirmada', 'anulada'],
    default: 'confirmada',
  })
  estado: 'confirmada' | 'anulada';

  @Prop({ required: true, default: 0 })
  gananciaTotal: number;
}

export const VentaSchema = SchemaFactory.createForClass(Venta);