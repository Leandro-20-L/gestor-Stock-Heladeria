import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductoDocument = HydratedDocument<Producto>;

export type TipoItem = 'producto' | 'insumo';
export type Categoria = 'helado' | 'bebida' | 'comida' | 'descartable' | 'materia_prima';
export type Unidad = 'kg' | 'unidad' | 'litro';

@Schema({ _id: false })
export class DescuentoStock {
  @Prop({ type: Types.ObjectId, ref: 'Producto', required: true })
  productoId: Types.ObjectId;

  @Prop({ required: true, min: 0.001 })
  cantidad: number;
}

export const DescuentoStockSchema =
  SchemaFactory.createForClass(DescuentoStock);

@Schema({ timestamps: true })
export class Producto {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, enum: ['producto', 'insumo'], default: 'producto' })
  tipo: TipoItem;

  @Prop({ required: true, enum: ['helado', 'bebida', 'comida', 'descartable', 'materia_prima'] })
  categoria: Categoria;

  @Prop({ required: false, min: 0, default: 0 })
  precioVenta: number;

  @Prop({ required: false, min: 0 })
  precioPoint?: number;

  @Prop({ required: false, min: 0 })
  costo?: number;

  @Prop({ required: true, enum: ['kg', 'unidad', 'litro'] })
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

ProductoSchema.index({ nombre: 1, categoria: 1, tipo: 1 });