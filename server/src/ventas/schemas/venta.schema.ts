import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VentaDocument = Venta & Document;

export type MedioPago = 'efectivo' | 'transferencia' | 'point';

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
}

export const VentaSchema = SchemaFactory.createForClass(Venta);
