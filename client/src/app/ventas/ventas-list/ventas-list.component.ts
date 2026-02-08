import { Component, computed, inject, signal } from '@angular/core';
import { MedioPago, Venta } from '../venta.model';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { VentasService } from '../../services/ventas.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2'; // <--- Importación mágica

@Component({
  selector: 'app-ventas-list',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas-list.component.html',
  styleUrl: './ventas-list.component.scss',
})
export class VentasListComponent {
  cargando = signal(false);
  ventas = signal<Venta[]>([]);
  abiertaId = signal<string | null>(null);
  private fb = inject(FormBuilder);

  filtro = this.fb.nonNullable.group({
    medioPago: ['' as '' | MedioPago],
    q: [''],
  });

  ventasFiltradas = computed(() => {
    const mp = this.filtro.controls.medioPago.value;
    const q = this.filtro.controls.q.value.trim().toLowerCase();

    let list = this.ventas();

    if (mp) list = list.filter((v) => v.medioPago === mp);

    if (q) {
      list = list.filter((v) =>
        (v.items ?? []).some((it) =>
          (it.nombreSnapshot ?? '').toLowerCase().includes(q),
        ),
      );
    }

    // más nuevas primero
    return list
      .slice()
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  });

  totalFiltrado = computed(() =>
    this.ventasFiltradas().reduce((acc, v) => acc + (v.total ?? 0), 0),
  );

  constructor(private ventasService: VentasService) {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.ventasService.getVentas().subscribe({
      next: (data) => this.ventas.set(data),
      error: () => alert('No se pudieron cargar las ventas'),
      complete: () => this.cargando.set(false),
    });
  }

  toggleDetalle(id: string) {
    this.abiertaId.set(this.abiertaId() === id ? null : id);
  }

  limpiarFiltros() {
    this.filtro.setValue({ medioPago: '', q: '' });
  }

  anular(v: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a anular la venta por $${v.total}`, // Ajusté el texto para que se vea mejor
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      // 1. Aquí capturamos la respuesta del usuario
      if (result.isConfirmed) {
        // 2. Solo si dijo "Sí", llamamos al servicio
        this.ventasService.anularVenta(v._id).subscribe({
          next: () => {
            // 3. (Opcional) Mensaje de éxito
            Swal.fire('¡Anulado!', 'La venta ha sido anulada.', 'success');
            this.cargar();
          },
          error: (e) => {
            Swal.fire(
              'Error',
              e?.error?.message ?? 'No se pudo anular',
              'error',
            );
          },
        });
      }
    });
  }
}
