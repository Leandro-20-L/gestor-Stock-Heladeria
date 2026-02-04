import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type Role = 'admin' | 'empleado';

export type AuthUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'token';
  private readonly userKey = 'user';

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.tokenKey, res.access_token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  get token() {
    return localStorage.getItem(this.tokenKey);
  }
  isLoggedIn(): boolean {
    return !!this.token;
  }

  get user() {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  get rol(): 'admin' | 'empleado' | null {
    return this.user?.rol ?? null;
  }

  isAdmin() {
    return this.rol === 'admin';
  }
}
