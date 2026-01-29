import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
//import { Producto } from "../entities/producto.entity";
import { Document, HydratedDocument } from 'mongoose';

export type ProductoDocument = HydratedDocument<Producto>;

export type Categoria = 'helado' | 'bebida' | 'comida';
export type Unidad = 'kg' | 'unidad';

@Schema({ timestamps: true })
export class Producto {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, enum: ['helado', 'bebida', 'comida'] })
  categoria: Categoria;

  @Prop({ required: true, min: 0 })
  precioVenta: number;

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
}

export const ProductoSchema = SchemaFactory.createForClass(Producto);

ProductoSchema.index({ nombre: 1, categoria: 1 });
