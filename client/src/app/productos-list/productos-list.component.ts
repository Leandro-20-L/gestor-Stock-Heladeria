import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Categoria, Producto, TipoItem } from '../productos/producto.model';
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

  // Nuevo control para alternar entre 'producto', 'insumo' o '' (todos)
  tipo = new FormControl<TipoItem | ''>('producto', { nonNullable: true });
  q = new FormControl<string>('', { nonNullable: true });
  categoria = new FormControl<string>('', { nonNullable: true });
  verInactivos = new FormControl<boolean>(false, { nonNullable: true });
  stockBajo = new FormControl<boolean>(false, { nonNullable: true });

  constructor(private productosService: ProductoService) {
    this.tipo.valueChanges.subscribe(() => {
      this.categoria.setValue('', { emitEvent: false }); // Limpia categoría al cambiar pestaña
      this.cargar();
    });
    this.q.valueChanges.pipe(debounceTime(300)).subscribe(() => this.cargar());
    this.categoria.valueChanges.subscribe(() => this.cargar());
    this.verInactivos.valueChanges.subscribe(() => this.cargar());
    this.stockBajo.valueChanges.subscribe(() => this.cargar());

    this.cargar();
  }

  cambiarTipo(nuevoTipo: TipoItem | '') {
    this.tipo.setValue(nuevoTipo);
  }

  cargar(mostrarToast = false) {
    const tipo = this.tipo.value || undefined;
    const q = this.q.value.trim();
    const categoria = (this.categoria.value || undefined) as
      | Categoria
      | undefined;
    const activos = this.verInactivos.value ? false : true;
    const stockBajo = this.stockBajo.value ? true : undefined;

    this.productosService
      .getAll({ tipo, q: q || undefined, categoria, activos, stockBajo } as any)
      .subscribe({
        next: (data) => {
          this.productos.set(data);

          if (mostrarToast) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Listado actualizado',
              showConfirmButton: false,
              timer: 1500,
              background: '#14161c',
              color: '#fff',
            });
          }
        },
        error: (err) => {
          if (err.status === 401) {
            Swal.fire({
              icon: 'warning',
              title: 'Sesión vencida',
              text: 'Cerrá sesión e ingresá nuevamente.',
              confirmButtonColor: '#ffd60a',
              background: '#14161c',
              color: '#fff',
            });
            return;
          }

          Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: `No se pudieron cargar los datos. Código: ${err.status}`,
            confirmButtonColor: '#d33',
            background: '#14161c',
            color: '#fff',
          });
        },
      });
  }

  desactivar(p: Producto) {
    Swal.fire({
      title: `¿Desactivar ${p.tipo === 'insumo' ? 'insumo' : 'producto'}?`,
      text: `Vas a quitar "${p.nombre}" del listado activo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffd60a',
      cancelButtonColor: '#d33',
      background: '#14161c',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productosService.deactivate(p._id).subscribe({
          next: () => {
            this.cargar();

            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              background: '#14161c',
              color: '#fff',
            });
            Toast.fire({ icon: 'success', title: 'Registro desactivado' });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo desactivar el registro.',
              background: '#14161c',
              color: '#fff',
            });
          },
        });
      }
    });
  }
}