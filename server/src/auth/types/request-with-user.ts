import { Request } from 'express';

export type AppRole = 'admin' | 'empleado';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: AppRole;
}

export type RequestWithUser = Request & { user?: JwtPayload };
