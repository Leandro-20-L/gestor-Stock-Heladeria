export type MedioPago = 'efectivo' | 'transferencia' | 'point';

export interface AgregadoVentaDto {
  productoId: string;
  cantidad: number;
}

export interface CreateVentaItemDto {
  productoId: string;
  cantidad: number;
  recargoUnitario?: number;
  insumosExcluidos?: string[];
  agregados?: AgregadoVentaDto[];
  notaModificadores?: string;
}

export interface CreateVentaDto {
  medioPago: MedioPago;
  items: CreateVentaItemDto[];
}

export interface VentaAgregado {
  productoId: string;
  nombreSnapshot: string;
  cantidad: number;
}

export interface VentaItem {
  productoId: string;
  nombreSnapshot: string;
  precioUnitarioSnapshot: number;
  cantidad: number;
  subtotal: number;
  insumosExcluidos?: string[];
  agregados?: VentaAgregado[];
  notaModificadores?: string;
}

export interface Venta {
  _id: string;
  items: VentaItem[];
  total: number;
  medioPago: MedioPago;
  estado: 'confirmada' | 'anulada';
  createdAt?: string;
  updatedAt?: string;
}