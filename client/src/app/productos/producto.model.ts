export type Categoria = 'helado' | 'bebida' | 'comida';
export type Unidad = 'kg' | 'unidad';

export interface Producto {
  _id: string;
  nombre: string;
  categoria: Categoria;
  precioVenta?: number;
  costo?: number;
  stockActual?: number;
  stockMinimo?: number;
  unidad: Unidad;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
