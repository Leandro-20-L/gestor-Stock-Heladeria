import { Injectable } from '@angular/core';
import { Categoria, Producto } from '../productos/producto.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  getAll(opts?: {
    q?: string;
    categoria?: Categoria;
    activos?: boolean;
    stockBajo?: boolean;
  }) {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.categoria) params = params.set('categoria', opts.categoria);
    if (opts?.activos === false) params = params.set('activos', 'false'); // mostrar todos
    if (opts?.stockBajo) params = params.set('stockBajo', 'true');

    return this.http.get<Producto[]>(this.baseUrl, { params });
  }

  getById(id: string) {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`);
  }

  create(data: Omit<Producto, '_id' | 'activo'>) {
    return this.http.post<Producto>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Producto>) {
    return this.http.patch<Producto>(`${this.baseUrl}/${id}`, data);
  }

  deactivate(id: string) {
    return this.http.delete<{ message: string; id: string }>(
      `${this.baseUrl}/${id}`,
    );
  }

  getProductosStockBajo() {
    return this.http.get<Producto[]>(`${this.baseUrl}?stockBajo=true`);
  }
}
