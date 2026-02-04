import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type StatsResumen = {
  rango: { from: string | null; to: string | null };
  totalFacturado: number;
  cantidadConfirmadas: number;
  cantidadAnuladas: number;
  porMedioPago: {
    medio: 'efectivo' | 'transferencia' | 'point';
    total: number;
    cantidad: number;
  }[];
  porDia: { fecha: string; total: number; cantidad: number }[];
  topProductos: { nombre: string; cantidad: number; total: number }[];
};

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private readonly baseUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  getResumen(opts?: { from?: string; to?: string }) {
    let params = new HttpParams();
    if (opts?.from) params = params.set('from', opts.from);
    if (opts?.to) params = params.set('to', opts.to);

    return this.http.get<StatsResumen>(`${this.baseUrl}/resumen`, { params });
  }
}
