import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Producto } from '../productos/producto.model';
import { CreateVentaDto, MedioPago, Venta } from '../ventas/venta.model';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private readonly ventasUrl = `${environment.apiUrl}/ventas`;
  private readonly productosUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  // ✅ Para armar el carrito desde productos disponibles
  getProductos(opts?: { q?: string; categoria?: string; activos?: boolean }) {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.categoria) params = params.set('categoria', opts.categoria);
    if (opts?.activos === false) params = params.set('activos', 'false');
    // por default tu backend ya devuelve activos

    return this.http.get<Producto[]>(this.productosUrl, { params });
  }

  crearVenta(dto: CreateVentaDto) {
    return this.http.post<Venta>(this.ventasUrl, dto);
  }

  // ✅ Listar ventas (si luego agregás filtros en Nest, ya queda listo)
  getVentas(filters?: {
    medioPago?: MedioPago;
    desde?: string;
    hasta?: string;
  }) {
    let params = new HttpParams();
    if (filters?.medioPago) params = params.set('medioPago', filters.medioPago);
    if (filters?.desde) params = params.set('desde', filters.desde);
    if (filters?.hasta) params = params.set('hasta', filters.hasta);

    return this.http.get<Venta[]>(this.ventasUrl, { params });
  }

  getVentaById(id: string) {
    return this.http.get<Venta>(`${this.ventasUrl}/${id}`);
  }

  anularVenta(id: string) {
    return this.http.patch(`${this.ventasUrl}/${id}/anular`, {});
  }
}
