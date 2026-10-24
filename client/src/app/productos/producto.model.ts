export type TipoItem = 'producto' | 'insumo';
export type Categoria = 'helado' | 'bebida' | 'comida' | 'descartable' | 'materia_prima';
export type Unidad = 'kg' | 'unidad' | 'litro';

export interface DescuentoStock {
  productoId: string;
  cantidad: number;
}

export interface Producto {
  _id: string;
  nombre: string;
  tipo: TipoItem;
  categoria: Categoria;
  precioVenta?: number;
  precioPoint?: number;
  costo?: number;
  stockActual?: number;
  stockMinimo?: number;
  unidad: Unidad;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  stockBajo?: boolean;
  descuentaStock?: DescuentoStock[];
}