import { Component, computed, inject, signal } from '@angular/core';
import { Producto } from '../../productos/producto.model';
import { CreateVentaDto, MedioPago } from '../venta.model';
import { VentasService } from '../../services/ventas.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop'; // <--- IMPORTANTE
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';

type CartItem = {
  producto: Producto;
  cantidad: number;
};

@Component({
  selector: 'app-ventas-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas-form.component.html',
  styleUrl: './ventas-form.component.scss',
})
export class VentasFormComponent {
  cargando = signal(false);
  productos = signal<Producto[]>([]);
  carrito = signal<CartItem[]>([]);
  private fb = inject(FormBuilder);

  categoriaActiva: 'helado' | 'comida' | 'bebida' = 'helado';

  setCategoria(cat: 'helado' | 'comida' | 'bebida') {
    this.categoriaActiva = cat;
  }

  // ReactiveForms (nonNullable para evitar nulls)
  form = this.fb.nonNullable.group({
    search: [''],
    medioPago: ['efectivo' as MedioPago, Validators.required],
  });

  // 1. CREAMOS EL SIGNAL DEL BUSCADOR
  searchQuery = toSignal(
    this.form.controls.search.valueChanges.pipe(debounceTime(300)),
    { initialValue: '' },
  );

  // lista filtrada según buscador
  productosFiltrados = computed(() => {
    const q = (this.searchQuery() || '').trim().toLowerCase();
    const list = this.productos();

    if (!q) return list.slice(0, 30); // para no listar infinito
    return list
      .filter((p) => (p.nombre ?? '').toLowerCase().includes(q))
      .slice(0, 50);
  });

  total = computed(() =>
    this.carrito().reduce(
      (acc, it) => acc + (it.producto.precioVenta ?? 0) * it.cantidad,
      0,
    ),
  );

  constructor(private ventasService: VentasService) {
    // Cargar productos al inicio
    this.refrescarProductos();

    // Si querés que el buscador “pegue” al backend:
    // this.form.controls.search.valueChanges.pipe(debounceTime(300)).subscribe(q => {
    //   this.refrescarProductos(q);
    // });

    // Si no, filtramos local (más rápido para el dueño)
  }

  refrescarProductos(q?: string) {
    this.cargando.set(true);
    this.ventasService.getProductos({ q }).subscribe({
      next: (data) => this.productos.set(data),
      error: () => alert('Error cargando productos'),
      complete: () => this.cargando.set(false),
    });
  }

  productosPorCategoria() {
    return this.productosFiltrados().filter(
      (p) => p.categoria === this.categoriaActiva,
    );
  }

  agregar(producto: Producto) {
    if (!producto.activo) return;

    const cart = this.carrito();
    const idx = cart.findIndex((i) => i.producto._id === producto._id);

    const stock = producto.stockActual ?? 0;

    // si ya está en carrito, incrementa (si hay stock)
    if (idx >= 0) {
      const actual = cart[idx].cantidad;
      if (actual + 1 > stock) return; // no pasar stock
      const copy = cart.slice();
      copy[idx] = { ...copy[idx], cantidad: actual + 1 };
      this.carrito.set(copy);
      return;
    }

    // si no está, lo agrega con 1 (si hay stock)
    if (stock < 1) return;

    this.carrito.set([...cart, { producto, cantidad: 1 }]);
  }

  aumentar(item: CartItem) {
    const stock = item.producto.stockActual ?? 0;
    if (item.cantidad + 1 > stock) return;

    this.carrito.set(
      this.carrito().map((i) =>
        i.producto._id === item.producto._id
          ? { ...i, cantidad: i.cantidad + 1 }
          : i,
      ),
    );
  }

  disminuir(item: CartItem) {
    if (item.cantidad - 1 <= 0) {
      this.quitar(item);
      return;
    }

    this.carrito.set(
      this.carrito().map((i) =>
        i.producto._id === item.producto._id
          ? { ...i, cantidad: i.cantidad - 1 }
          : i,
      ),
    );
  }

  quitar(item: CartItem) {
    this.carrito.set(
      this.carrito().filter((i) => i.producto._id !== item.producto._id),
    );
  }

  limpiar() {
    this.carrito.set([]);
    this.form.controls.search.setValue('');
  }

  confirmar() {
    if (this.carrito().length === 0) {
      alert('Agregá al menos 1 producto.');
      return;
    }
    if (this.form.invalid) return;

    const dto: CreateVentaDto = {
      medioPago: this.form.controls.medioPago.value,
      items: this.carrito().map((i) => ({
        productoId: i.producto._id,
        cantidad: i.cantidad,
      })),
    };

    Swal.fire({
      title: '¿Confirmar venta?',
      // Muestra el total y el medio de pago en negrita
      html: `
        Total a cobrar: <b style="font-size: 1.2em; color: #ffd60a">$${this.total()}</b>
        <br>
        Medio de pago: <b>${dto.medioPago.toUpperCase()}</b>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cobrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffd60a', // Amarillo
      cancelButtonColor: '#d33', // Rojo
      background: '#14161c', // Fondo oscuro
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        this.enviarVenta(dto);
      }
    });
  }

  // Método auxiliar para mantener limpio el código
  private enviarVenta(dto: CreateVentaDto) {
    this.cargando.set(true);

    // Feedback de carga (bloquea la pantalla para no doble click)
    Swal.fire({
      title: 'Procesando...',
      text: 'Registrando venta',
      allowOutsideClick: false,
      background: '#14161c',
      color: '#fff',
      didOpen: () => Swal.showLoading(),
    });

    this.ventasService.crearVenta(dto).subscribe({
      next: () => {
        // ÉXITO
        Swal.fire({
          icon: 'success',
          title: '¡Venta Registrada!',
          text: 'El stock se ha actualizado.',
          timer: 2000, // Se cierra solo en 2 segs
          showConfirmButton: false,
          background: '#14161c',
          color: '#fff',
        });

        this.limpiar();
        this.refrescarProductos();
      },
      error: (err) => {
        // ERROR
        const msg = err?.error?.message
          ? Array.isArray(err.error.message)
            ? err.error.message.join(' | ')
            : err.error.message
          : 'No se pudo registrar la venta';

        Swal.fire({
          icon: 'error',
          title: 'Ocurrió un error',
          text: msg,
          confirmButtonColor: '#d33',
          background: '#14161c',
          color: '#fff',
        });
      },
      complete: () => this.cargando.set(false),
    });
  }

  // helpers UI
  stockDisponible(p: Producto) {
    return p.stockActual ?? 0;
  }

  puedeAgregar(p: Producto) {
    const stock = p.stockActual ?? 0;
    if (!p.activo) return false;
    if (stock <= 0) return false;

    const item = this.carrito().find((i) => i.producto._id === p._id);
    if (!item) return true;
    return item.cantidad < stock;
  }
}
