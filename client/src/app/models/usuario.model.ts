export type Rol = 'admin' | 'empleado';

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}
