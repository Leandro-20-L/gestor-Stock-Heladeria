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

  constructor(private productosService: ProductoService) {
    // búsqueda automática mientras escribe (opcional)
    this.q.valueChanges.pipe(debounceTime(300)).subscribe(() => this.cargar());
    this.categoria.valueChanges.subscribe(() => this.cargar());
    this.verInactivos.valueChanges.subscribe(() => this.cargar());

    this.cargar();
  }

  cargar() {
    const q = this.q.value.trim();
    const categoria = (this.categoria.value || undefined) as
      | Categoria
      | undefined;
    const activos = this.verInactivos.value ? false : true;

    this.productosService
      .getAll({ q: q || undefined, categoria, activos })
      .subscribe({
        next: (data) => this.productos.set(data),
        error: () => alert('Error cargando productos'),
      });
  }

  desactivar(p: Producto) {
    if (!confirm(`¿Desactivar "${p.nombre}"?`)) return;

    this.productosService.deactivate(p._id).subscribe({
      next: () => this.cargar(),
      error: () => alert('No se pudo desactivar'),
    });
  }
}
