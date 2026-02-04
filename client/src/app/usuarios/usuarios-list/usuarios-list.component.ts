import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rol, Usuario } from '../../models/usuario.model';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-usuarios-list',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss',
})
export class UsuariosListComponent {
  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  creando = signal(false);
  errorMsg = signal<string | null>(null);
  private fb = inject(FormBuilder);

  mostrarForm = signal(false);

  // filtros rápidos (opcional)
  q = signal('');
  verInactivos = signal(false);

  usuariosFiltrados = computed(() => {
    const texto = this.q().trim().toLowerCase();
    const inactivos = this.verInactivos();

    return this.usuarios()
      .filter((u: any) => (inactivos ? true : u.activo))
      .filter((u: any) => {
        if (!texto) return true;
        return (
          u.nombre.toLowerCase().includes(texto) ||
          u.email.toLowerCase().includes(texto) ||
          u.rol.toLowerCase().includes(texto)
        );
      });
  });

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['empleado' as Rol, [Validators.required]],
  });

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.errorMsg.set(null);
    this.cargando.set(true);

    this.usuariosService.getAll().subscribe({
      next: (data: any) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: (e: any) => {
        this.cargando.set(false);
        this.errorMsg.set(e?.error?.message ?? 'Error al cargar usuarios');
      },
    });
  }

  abrirCrear() {
    this.form.reset({ rol: 'empleado' });
    this.mostrarForm.set(true);
    this.errorMsg.set(null);
  }

  cancelarCrear() {
    this.mostrarForm.set(false);
  }

  crear() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre, email, password, rol } = this.form.value;

    this.creando.set(true);
    this.errorMsg.set(null);

    this.usuariosService
      .create({
        nombre: String(nombre),
        email: String(email),
        password: String(password),
        rol: rol as Rol,
      })
      .subscribe({
        next: (nuevo: any) => {
          this.usuarios.set([nuevo, ...this.usuarios()]);
          this.creando.set(false);
          this.mostrarForm.set(false);
        },
        error: (e: any) => {
          this.creando.set(false);
          this.errorMsg.set(e?.error?.message ?? 'Error al crear usuario');
        },
      });
  }

  cambiarRol(u: Usuario, rol: Rol) {
    if (rol === u.rol) return;

    this.usuariosService.setRol(u._id, rol).subscribe({
      next: (updated: any) => {
        this.usuarios.set(
          this.usuarios().map((x: any) =>
            x._id === updated._id ? updated : x,
          ),
        );
      },
      error: (e: any) => {
        alert(e?.error?.message ?? 'Error al cambiar rol');
      },
    });
  }

  toggleActivo(u: Usuario) {
    const nuevo = !u.activo;
    const ok = confirm(
      nuevo ? `¿Activar a ${u.nombre}?` : `¿Desactivar a ${u.nombre}?`,
    );
    if (!ok) return;

    this.usuariosService.setActivo(u._id, nuevo).subscribe({
      next: (updated: any) => {
        this.usuarios.set(
          this.usuarios().map((x: any) =>
            x._id === updated._id ? updated : x,
          ),
        );
      },
      error: (e: any) => {
        alert(e?.error?.message ?? 'Error al cambiar estado');
      },
    });
  }

  // helpers template
  ctrl(name: 'nombre' | 'email' | 'password' | 'rol') {
    return this.form.controls[name];
  }
}
