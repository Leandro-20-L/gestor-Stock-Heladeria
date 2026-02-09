import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rol, Usuario } from '../../models/usuario.model';
import { UsuariosService } from '../../services/usuarios.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios-list',
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss',
})
export class UsuariosListComponent {
  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  creando = signal(false);
  errorMsg = signal<string | null>(null);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

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
        rol: rol as any,
      })
      .subscribe({
        next: (nuevo: any) => {
          this.usuarios.update((prev) => [nuevo, ...prev]); // Forma moderna de actualizar signals
          this.creando.set(false);
          this.mostrarForm.set(false);

          // 3. MOSTRAR SNACKBAR AQUÍ 👇
          this.snackBar.open(`¡Usuario "${nombre}" creado!`, 'Genial', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar'], // Clase personalizada
          });

          this.form.reset(); // Opcional: limpiar form
        },
        error: (e: any) => {
          this.creando.set(false);
          this.errorMsg.set(e?.error?.message ?? 'Error al crear usuario');

          // Opcional: Snackbar de error también
          this.snackBar.open('Error al crear', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  cambiarRol(u: Usuario, rol: Rol) {
    // Si elige el mismo rol que ya tiene, no hacemos nada
    if (rol === u.rol) return;

    this.usuariosService.setRol(u._id, rol).subscribe({
      next: (updated: any) => {
        // 1. Actualizamos la lista localmente
        this.usuarios.update((prev) =>
          prev.map((x: any) => (x._id === updated._id ? updated : x)),
        );

        // 2. SNACKBAR DE ÉXITO (Amarillo/Oscuro)
        this.snackBar.open(
          `Rol de ${u.nombre} cambiado a ${rol.toUpperCase()}`,
          'Listo',
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar'], // Tu clase personalizada
          },
        );
      },
      error: (e: any) => {
        // 3. SNACKBAR DE ERROR (Rojo/Oscuro)
        this.snackBar.open(
          e?.error?.message ?? 'Error al cambiar rol',
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['error-snackbar'],
          },
        );
      },
    });
  }

  toggleActivo(u: Usuario) {
    const nuevo = !u.activo;
    const accion = nuevo ? 'Activar' : 'Desactivar';

    Swal.fire({
      title: `¿${accion} usuario?`,
      text: `Vas a cambiar el estado de "${u.nombre}" a ${nuevo ? 'ACTIVO' : 'INACTIVO'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion.toLowerCase()}`,
      cancelButtonText: 'Cancelar',
      // Usamos tu amarillo para confirmar, y rojo estándar para cancelar
      confirmButtonColor: '#ffd60a',
      cancelButtonColor: '#d33',
      background: '#14161c', // Fondo oscuro
      color: '#fff', // Texto blanco
    }).then((result) => {
      // Solo si el usuario confirma, hacemos la llamada a la API
      if (result.isConfirmed) {
        this.usuariosService.setActivo(u._id, nuevo).subscribe({
          next: (updated: any) => {
            // Actualizamos la lista localmente
            this.usuarios.update((prev) =>
              prev.map((x: any) => (x._id === updated._id ? updated : x)),
            );

            // Feedback visual rápido (Toast)
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              background: '#14161c',
              color: '#fff',
            });

            Toast.fire({
              icon: 'success',
              title: `Usuario ${nuevo ? 'activado' : 'desactivado'} correctamente`,
            });
          },
          error: (e: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: e?.error?.message ?? 'No se pudo cambiar el estado',
              background: '#14161c',
              color: '#fff',
              confirmButtonColor: '#d33',
            });
          },
        });
      }
    });
  }

  // helpers template
  ctrl(name: 'nombre' | 'email' | 'password' | 'rol') {
    return this.form.controls[name];
  }
}
