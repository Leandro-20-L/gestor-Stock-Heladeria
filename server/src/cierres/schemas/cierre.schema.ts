import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class CierreItem {
  @Prop({ type: Types.ObjectId, ref: 'Producto', required: true })
  productoId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  stockTeorico: number;

  @Prop({ required: true, min: 0 })
  stockContado: number;

  @Prop({ required: true })
  diferencia: number; // contado - teorico
}

const CierreItemSchema = SchemaFactory.createForClass(CierreItem);

@Schema({ timestamps: true })
export class Cierre {
  @Prop({ required: true })
  fecha: string; // 'YYYY-MM-DD'

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: false })
  usuarioId?: Types.ObjectId;

  @Prop({ type: [CierreItemSchema], default: [] })
  items: CierreItem[];

  @Prop({ default: 0 })
  totalProductos: number;

  @Prop({ default: 0 })
  conDiferencias: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalVentasTeorico: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalCajaContada: number;

  @Prop({ required: true, default: 0 })
  diferenciaCaja: number; // totalCajaContada - totalVentasTeorico

  @Prop({ required: true, min: 0, default: 0 })
  totalEfectivoSistema: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalTransferenciaSistema: number;

  @Prop({ required: true, min: 0, default: 0 })
  totalPointSistema: number;

  @Prop({ required: true, min: 0, default: 0 })
  efectivoContado: number;

  @Prop({ required: true, default: 0 })
  diferenciaEfectivo: number;
}

export type CierreDocument = Cierre & Document;
export const CierreSchema = SchemaFactory.createForClass(Cierre);

// 1 cierre por día
CierreSchema.index({ fecha: 1 }, { unique: true });
