export interface CierreItem {
  productoId: {
    _id: string;
    nombre: string;
    unidad: 'kg' | 'unidad';
  };
  stockTeorico: number;
  stockContado: number;
  diferencia: number;
}

export interface Cierre {
  _id: string;
  fecha: string;
  totalProductos: number;
  conDiferencias: number;
  items: CierreItem[];
  createdAt?: string;
}
