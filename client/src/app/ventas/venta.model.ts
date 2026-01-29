export type MedioPago = 'efectivo' | 'transferencia' | 'point';

export interface CreateVentaItemDto {
  productoId: string;
  cantidad: number;
}

export interface CreateVentaDto {
  medioPago: MedioPago;
  items: CreateVentaItemDto[];
}

export interface VentaItem {
  productoId: string;
  nombreSnapshot: string;
  precioUnitarioSnapshot: number;
  cantidad: number;
  subtotal: number;
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
