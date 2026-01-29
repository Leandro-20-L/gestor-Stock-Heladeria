import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Cierre } from '../cierre-del-dia/cierre.model';

export interface CierreItemInput {
  productoId: string;
  stockContado: number;
}

export interface CrearCierreDto {
  fecha: string; // YYYY-MM-DD
  items: CierreItemInput[];
}

@Injectable({
  providedIn: 'root',
})
export class CierresService {
  private readonly baseUrl = `${environment.apiUrl}/cierres`;

  constructor(private http: HttpClient) {}

  crearCierre(dto: CrearCierreDto) {
    return this.http.post(`${this.baseUrl}`, dto);
  }

  getCierrePorFecha(fecha: string) {
    return this.http.get(`${this.baseUrl}?fecha=${fecha}`);
  }

  getAll() {
    return this.http.get<Cierre[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Cierre>(`${this.baseUrl}/${id}`);
  }
}
