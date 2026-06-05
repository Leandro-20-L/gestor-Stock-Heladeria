import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductoDocument = HydratedDocument<Producto>;

export type Categoria = 'helado' | 'bebida' | 'comida';
export type Unidad = 'kg' | 'unidad';

@Schema({ _id: false })
export class DescuentoStock {
  @Prop({ type: Types.ObjectId, ref: 'Producto', required: true })
  productoId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  cantidad: number;
}

export const DescuentoStockSchema =
  SchemaFactory.createForClass(DescuentoStock);

@Schema({ timestamps: true })
export class Producto {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, enum: ['helado', 'bebida', 'comida'] })
  categoria: Categoria;

  @Prop({ required: true, min: 0 })
  precioVenta: number;

  @Prop({ required: false, min: 0 })
  precioPoint?: number;

  @Prop({ required: false, min: 0 })
  costo?: number;

  @Prop({ required: true, enum: ['kg', 'unidad'] })
  unidad: Unidad;

  @Prop({ default: true })
  activo: boolean;

  @Prop({ default: 0, min: 0 })
  stockActual: number;

  @Prop({ default: 0, min: 0 })
  stockMinimo: number;

  @Prop({ type: [DescuentoStockSchema], default: [] })
  descuentaStock: DescuentoStock[];
}

export const ProductoSchema = SchemaFactory.createForClass(Producto);

ProductoSchema.index({ nombre: 1, categoria: 1 });
