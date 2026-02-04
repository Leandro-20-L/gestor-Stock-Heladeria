import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Rol, Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  create(dto: { nombre: string; email: string; password: string; rol: Rol }) {
    return this.http.post<Usuario>(this.baseUrl, dto);
  }

  setRol(id: string, rol: Rol) {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/rol`, { rol });
  }

  setActivo(id: string, activo: boolean) {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/estado`, { activo });
  }
}
