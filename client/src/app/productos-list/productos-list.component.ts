import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Categoria, Producto, Unidad } from '../productos/producto.model';
import { ProductoService } from '../services/producto.service';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos-list',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './productos-list.component.html',
  styleUrl: './productos-list.component.scss',
})
export class ProductosListComponent {
  productos = signal<Producto[]>([]);

  q = new FormControl<string>('', { nonNullable: true });
  categoria = new FormControl<string>('', { nonNullable: true });
  verInactivos = new FormControl<boolean>(false, { nonNullable: true });
  stockBajo = new FormControl<boolean>(false, { nonNullable: true });
  constructor(private productosService: ProductoService) {
    // búsqueda automática mientras escribe (opcional)
    this.q.valueChanges.pipe(debounceTime(300)).subscribe(() => this.cargar());
    this.categoria.valueChanges.subscribe(() => this.cargar());
    this.verInactivos.valueChanges.subscribe(() => this.cargar());
    this.stockBajo.valueChanges.subscribe(() => this.cargar());

    this.cargar();
  }

  cargar() {
    const q = this.q.value.trim();
    const categoria = (this.categoria.value || undefined) as
      | Categoria
      | undefined;
    const activos = this.verInactivos.value ? false : true;
    const stockBajo = this.stockBajo.value ? true : undefined;

    this.productosService
      .getAll({ q: q || undefined, categoria, activos, stockBajo })
      .subscribe({
        next: (data) => this.productos.set(data),
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudieron cargar los productos.',
            confirmButtonColor: '#d33',
            background: '#14161c',
            color: '#fff',
          });
        },
      });
  }

  desactivar(p: Producto) {
    Swal.fire({
      title: '¿Desactivar producto?',
      text: `Vas a quitar "${p.nombre}" del listado activo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffd60a', // Amarillo (Acción principal)
      cancelButtonColor: '#d33', // Rojo (Cancelar)
      background: '#14161c', // Fondo oscuro
      color: '#fff', // Texto blanco
    }).then((result) => {
      // Solo ejecutamos si el usuario confirmó
      if (result.isConfirmed) {
        this.productosService.deactivate(p._id).subscribe({
          next: () => {
            this.cargar();

            // Opcional: Feedback visual de éxito rápido (Toast)
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              background: '#14161c',
              color: '#fff',
            });
            Toast.fire({ icon: 'success', title: 'Producto desactivado' });
          },
          error: () => {
            // 3. REEMPLAZO DEL ALERT DE ERROR AL DESACTIVAR
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo desactivar el producto.',
              background: '#14161c',
              color: '#fff',
            });
          },
        });
      }
    });
  }
}
