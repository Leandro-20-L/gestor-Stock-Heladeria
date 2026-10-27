import { Component, computed, inject, signal } from '@angular/core';
import { Producto } from '../../productos/producto.model';
import { CreateVentaDto, MedioPago } from '../venta.model';
import { VentasService } from '../../services/ventas.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';

export type CartAgregado = {
  insumoId: string;
  nombre: string;
  cantidad: number;
};

export type CartItem = {
  uid: string; // Permite tener en el mismo pedido 1 hamburguesa común y 1 doble sin papas
  producto: Producto;
  cantidad: number;
  insumosExcluidos: string[]; // IDs de insumos quitados ("Sin papas")
  agregados: CartAgregado[];  // Extras ("+1 Medallón")
  recargoUnitario: number;    // $ extra por unidad si lleva agregados
  abierto?: boolean;          // Muestra/oculta el panel de personalización en el carrito
};

@Component({
  selector: 'app-ventas-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ventas-form.component.html',
  styleUrl: './ventas-form.component.scss',
})
export class VentasFormComponent {
  cargando = signal(false);
  productos = signal<Producto[]>([]);
  carrito = signal<CartItem[]>([]);
  private fb = inject(FormBuilder);

  categoriaActiva: 'helado' | 'comida' | 'bebida' = 'helado';

  // Insumo seleccionado temporalmente en el desplegable de agregados
  insumoExtraSeleccionado: Record<string, string> = {};

  // Agregá esta señal arriba junto a tus otras señales (debajo de carrito = signal...):
itemModalUid = signal<string | null>(null);
insumoExtraSeleccionadoId = '';

// Computed que obtiene el ítem que se está editando actualmente en el modal:
itemEnModal = computed(() => {
  const uid = this.itemModalUid();
  if (!uid) return null;
  return this.carrito().find((i) => i.uid === uid) ?? null;
});

abrirModalPersonalizar(item: CartItem) {
  this.insumoExtraSeleccionadoId = '';
  this.itemModalUid.set(item.uid);
}

cerrarModalPersonalizar() {
  this.itemModalUid.set(null);
}

// 1. Agregá esta función para que Angular NO destruya el input mientras escribís:
  trackByUid(index: number, item: CartItem): string {
    return item.uid;
  }

  costoInsumo(insumoId: string): number {
    const ins = this.productos().find((p) => p._id === insumoId);
    return Number(ins?.costo ?? 0);
  }

// Si el cliente pidió 2 o más iguales pero solo 1 lleva agregado/sin papas, la separa en otro renglón
separarUnidadParaPersonalizar(item: CartItem) {
  if (item.cantidad <= 1) return;

  const nuevoUid = crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

  const nuevaUnidad: CartItem = {
    uid: nuevoUid,
    producto: item.producto,
    cantidad: 1,
    insumosExcluidos: [...item.insumosExcluidos],
    agregados: item.agregados.map((a) => ({ ...a })),
    recargoUnitario: item.recargoUnitario,
  };

  this.carrito.set([
    ...this.carrito().map((i) =>
      i.uid === item.uid ? { ...i, cantidad: i.cantidad - 1 } : i,
    ),
    nuevaUnidad,
  ]);

  this.itemModalUid.set(nuevoUid);
}

  setCategoria(cat: 'helado' | 'comida' | 'bebida') {
    this.categoriaActiva = cat;
  }

  form = this.fb.nonNullable.group({
    search: [''],
    medioPago: ['efectivo' as MedioPago, Validators.required],
  });

  searchQuery = toSignal(
    this.form.controls.search.valueChanges.pipe(debounceTime(300)),
    { initialValue: '' },
  );

  // Solo los insumos (para el selector de agregados y nombres de recetas)
  insumosDisponibles = computed(() =>
    this.productos().filter((p) => p.tipo === 'insumo' && p.activo),
  );

  // Solo productos de venta (oculta los insumos del mostrador)
  productosFiltrados = computed(() => {
    const q = (this.searchQuery() || '').trim().toLowerCase();
    const list = this.productos().filter((p) => p.tipo !== 'insumo');

    if (!q) return list.slice(0, 30);
    return list
      .filter((p) => (p.nombre ?? '').toLowerCase().includes(q))
      .slice(0, 50);
  });

  total = computed(() =>
    this.carrito().reduce(
      (acc, item) => acc + this.precioUnitarioItem(item) * item.cantidad,
      0,
    ),
  );

  constructor(private ventasService: VentasService) {
    this.refrescarProductos();
  }

  productosRapidos() {
    return this.productos()
      .filter((p) => p.tipo !== 'insumo')
      .filter((p) =>
        [
          'Kilo',
          'Medio',
          'Cuarto',
          'PopCorn',
          'Sánguche de Milanesa',
          'Hamburguesas Super Completa con fritas',
        ].includes(p.nombre),
      )
      .filter((p) => p.activo);
  }

  agregarMobile(p: Producto) {
    if (window.innerWidth <= 900) {
      this.agregar(p);
    }
  }

  precioProducto(p: Producto) {
    const medio = this.form.controls.medioPago.value;
    if (medio === 'point' && p.precioPoint != null) {
      return p.precioPoint;
    }
    return p.precioVenta ?? 0;
  }

  // Precio base + recargo por agregados (ej: doble carne)
 precioUnitarioItem(item: CartItem) {
    const base = this.precioProducto(item.producto);
    const ajuste = Number(item.recargoUnitario) || 0;
    return Math.max(0, base + ajuste); // Nunca baja de $0
  }

  refrescarProductos(q?: string, mostrarToast = false) {
    this.cargando.set(true);

    this.ventasService.getProductos({ q }).subscribe({
      next: (data) => {
        this.productos.set(data);

        if (mostrarToast) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Productos actualizados',
            showConfirmButton: false,
            timer: 1500,
            background: '#14161c',
            color: '#fff',
          });
        }
      },
      error: (err) => {
        this.cargando.set(false);
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
          title: 'No se cargaron los productos',
          text: `Tocá recargar o revisá la conexión. Código: ${err.status}`,
          confirmButtonColor: '#d33',
          background: '#14161c',
          color: '#fff',
        });
      },
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
    const stock = this.stockDisponible(producto);

    // Buscamos si ya hay uno igual SIN personalizaciones para agruparlo
    const idx = cart.findIndex(
      (i) =>
        i.producto._id === producto._id &&
        i.insumosExcluidos.length === 0 &&
        i.agregados.length === 0 &&
        i.recargoUnitario === 0,
    );

    if (idx >= 0) {
      const actual = cart[idx].cantidad;
      if (actual + 1 > stock) return;
      const copy = cart.slice();
      copy[idx] = { ...copy[idx], cantidad: actual + 1 };
      this.carrito.set(copy);
      return;
    }

    if (stock < 1) return;

    this.carrito.set([
      ...cart,
      {
        uid: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        producto,
        cantidad: 1,
        insumosExcluidos: [],
        agregados: [],
        recargoUnitario: 0,
        abierto: false,
      },
    ]);
  }

  // Separa una unidad en un renglón nuevo si querés personalizar solo 1 de las hamburguesas
  togglePersonalizar(item: CartItem) {
    this.carrito.set(
      this.carrito().map((i) =>
        i.uid === item.uid ? { ...i, abierto: !i.abierto } : i,
      ),
    );
  }

  

  nombreInsumo(insumoId: string): string {
    const found = this.productos().find((p) => p._id === insumoId);
    return found ? found.nombre : 'Insumo';
  }

  // Quitar / restaurar un ingrediente de la receta base (ej: "Sin papas")
  // Al destildar un ingrediente (ej: "Sin papas"), resta su costo automáticamente
  toggleExcluirInsumo(item: CartItem, insumoId: string) {
    const yaEstabaExcluido = item.insumosExcluidos.includes(insumoId);
    const excluidos = yaEstabaExcluido
      ? item.insumosExcluidos.filter((id) => id !== insumoId)
      : [...item.insumosExcluidos, insumoId];

    const rec = item.producto.descuentaStock?.find((r) => r.productoId === insumoId);
    const cantReceta = rec ? Number(rec.cantidad) : 1;
    const costoDeEseInsumo = this.costoInsumo(insumoId) * cantReceta;

    // Si lo quita, resta el costo; si lo vuelve a activar, lo vuelve a sumar
    const nuevoAjuste = yaEstabaExcluido
      ? item.recargoUnitario + costoDeEseInsumo
      : item.recargoUnitario - costoDeEseInsumo;

    this.carrito.set(
      this.carrito().map((i) =>
        i.uid === item.uid
          ? { ...i, insumosExcluidos: excluidos, recargoUnitario: nuevoAjuste }
          : i,
      ),
    );
  }

  // Sumar un insumo extra (ej: +1 Medallón para doble)
  agregarExtra(item: CartItem) {
    const insumoId = this.insumoExtraSeleccionado[item.uid];
    if (!insumoId) return;

    const insumo = this.productos().find((p) => p._id === insumoId);
    if (!insumo) return;

    const existe = item.agregados.find((a) => a.insumoId === insumoId);
    const nuevosAgregados = existe
      ? item.agregados.map((a) =>
          a.insumoId === insumoId ? { ...a, cantidad: a.cantidad + 1 } : a,
        )
      : [...item.agregados, { insumoId, nombre: insumo.nombre, cantidad: 1 }];

    const costoExtra = this.costoInsumo(insumoId);

    this.carrito.set(
      this.carrito().map((i) =>
        i.uid === item.uid
          ? {
              ...i,
              agregados: nuevosAgregados,
              recargoUnitario: i.recargoUnitario + costoExtra,
            }
          : i,
      ),
    );
  }

 quitarExtra(item: CartItem, insumoId: string) {
    const nuevosAgregados = item.agregados
      .map((a) =>
        a.insumoId === insumoId ? { ...a, cantidad: a.cantidad - 1 } : a,
      )
      .filter((a) => a.cantidad > 0);

    const costoExtra = this.costoInsumo(insumoId);

    this.carrito.set(
      this.carrito().map((i) =>
        i.uid === item.uid
          ? {
              ...i,
              agregados: nuevosAgregados,
              recargoUnitario: i.recargoUnitario - costoExtra,
            }
          : i,
      ),
    );
  }
 actualizarRecargo(item: CartItem, valor: string | number) {
    const num = Number(valor);
    this.carrito.set(
      this.carrito().map((i) =>
        i.uid === item.uid
          ? { ...i, recargoUnitario: isNaN(num) ? 0 : num }
          : i,
      ),
    );
  }

  ajustarMontoRapido(item: CartItem, delta: number) {
    this.actualizarRecargo(item, (Number(item.recargoUnitario) || 0) + delta);
  }

  
  resumenModificadores(item: CartItem): string {
    const partes: string[] = [];
    if (item.insumosExcluidos.length > 0) {
      const nombres = item.insumosExcluidos.map((id) => this.nombreInsumo(id)).join(', ');
      partes.push(`Sin: ${nombres}`);
    }
    if (item.agregados.length > 0) {
      const extras = item.agregados.map((a) => `+${a.cantidad} ${a.nombre}`).join(', ');
      partes.push(`Extra: ${extras}`);
    }
    return partes.join(' | ');
  }

  aumentar(item: CartItem) {
    const stock = this.stockDisponible(item.producto);
    if (item.cantidad + 1 > stock) return;

    this.carrito.set(
      this.carrito().map((i) =>
        i.uid === item.uid ? { ...i, cantidad: i.cantidad + 1 } : i,
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
        i.uid === item.uid ? { ...i, cantidad: i.cantidad - 1 } : i,
      ),
    );
  }

  quitar(item: CartItem) {
    this.carrito.set(this.carrito().filter((i) => i.uid !== item.uid));
  }

  limpiar() {
    this.carrito.set([]);
    this.form.controls.search.setValue('');
  }

  confirmar() {
    const detalleHtml = this.carrito()
      .map((item) => {
        const precio = this.precioUnitarioItem(item);
        const subtotal = precio * item.cantidad;
        const nota = this.resumenModificadores(item);

        return `
      <div style="display:flex; justify-content:space-between; gap:12px; margin:6px 0;">
        <div>
          <span>${item.producto.nombre} x${item.cantidad}</span>
          ${nota ? `<div style="font-size:0.8em; color:#ffd60a;">(${nota})</div>` : ''}
        </div>
        <b>$${subtotal}</b>
      </div>
    `;
      })
      .join('');

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
        recargoUnitario: i.recargoUnitario || 0,
        insumosExcluidos: i.insumosExcluidos,
        agregados: i.agregados.map((a) => ({
          productoId: a.insumoId,
          cantidad: a.cantidad,
        })),
        notaModificadores: this.resumenModificadores(i),
      })),
    };

    Swal.fire({
      title: '¿Confirmar venta?',
      html: `
    <div style="text-align:left; margin-bottom:12px;">
      ${detalleHtml}
    </div>
    <hr style="border-color: rgba(255,255,255,.15);">
    <div style="display:flex; justify-content:space-between; margin-top:12px;">
      <span>Total a cobrar:</span>
      <b style="font-size: 1.2em; color: #ffd60a">$${this.total()}</b>
    </div>
    <br>
    Medio de pago: <b>${dto.medioPago.toUpperCase()}</b>
  `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cobrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffd60a',
      cancelButtonColor: '#d33',
      background: '#14161c',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        this.enviarVenta(dto);
      }
    });
  }

  private enviarVenta(dto: CreateVentaDto) {
    this.cargando.set(true);

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
        Swal.fire({
          icon: 'success',
          title: '¡Venta Registrada!',
          text: 'El stock se ha actualizado.',
          timer: 2000,
          showConfirmButton: false,
          background: '#14161c',
          color: '#fff',
        });

        this.limpiar();
        this.refrescarProductos();
      },
      error: (err) => {
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

  // Si el producto descuenta insumos, calcula cuántos se pueden armar según el stock de insumos
  stockDisponible(p: Producto): number {
    if (p.descuentaStock && p.descuentaStock.length > 0) {
      const todos = this.productos();
      const posibles = p.descuentaStock.map((receta) => {
        const insumo = todos.find((item) => item._id === receta.productoId);
        if (!insumo) return 999;
        return Math.floor((insumo.stockActual ?? 0) / receta.cantidad);
      });
      return Math.min(...posibles);
    }
    return p.stockActual ?? 0;
  }

  puedeAgregar(p: Producto) {
    const stock = this.stockDisponible(p);
    if (!p.activo) return false;
    if (stock <= 0) return false;

    const totalEnCarrito = this.carrito()
      .filter((i) => i.producto._id === p._id)
      .reduce((acc, i) => acc + i.cantidad, 0);

    return totalEnCarrito < stock;
  }
}