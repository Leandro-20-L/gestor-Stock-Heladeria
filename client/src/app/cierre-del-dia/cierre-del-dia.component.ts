import { Component } from '@angular/core';
import { ProductoService } from '../services/producto.service';
import { CierresService } from '../services/cierres.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../productos/producto.model';
import { StatsService } from '../services/stats.service';
import Swal from 'sweetalert2';

type Row = Omit<Producto, 'stockActual' | 'stockMinimo'> & {
  stockActual: number;
  stockMinimo: number;
  stockContado: number | null;
};

@Component({
  selector: 'app-cierre-del-dia',
  imports: [FormsModule, CommonModule],
  templateUrl: './cierre-del-dia.component.html',
  styleUrl: './cierre-del-dia.component.scss',
})
export class CierreDelDiaComponent {
  fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  rows: Row[] = [];
  guardando = false;
  totalCajaContada: number | null = null;
  totalVentasTeorico: number | null = null;
  cargandoTotal = false;

  constructor(
    private productosService: ProductoService,
    private cierresService: CierresService,
    private statsService: StatsService,
  ) {}

  ngOnInit() {
    this.productosService.getAll({ activos: true }).subscribe({
      next: (productos) => {
        this.rows = productos.map(
          (p): Row => ({
            ...p,
            stockActual: Number(p.stockActual ?? 0),
            stockMinimo: Number(p.stockMinimo ?? 0),
            stockContado: null,
          }),
        );
      },
    });
    this.cargarTotalDelDia();
  }

  diferencia(r: Row) {
    if (r.stockContado === null) return null;
    return Number(r.stockContado) - Number(r.stockActual);
  }

  guardar() {
    // 1. PREPARAR DATOS
    const items = this.rows
      .filter((r) => r.stockContado !== null && r.stockContado !== undefined)
      .map((r) => ({
        productoId: r._id,
        stockContado: Number(r.stockContado),
      }));

    // 2. VALIDACIONES (Usando SweetAlert 'warning')
    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Cargá el stock contado de al menos un producto.',
        confirmButtonColor: '#ffc107', // Tu color amarillo
        color: '#fff',
        background: '#14161c', // Fondo oscuro
      });
      return;
    }

    if (
      this.totalCajaContada === null ||
      Number.isNaN(Number(this.totalCajaContada))
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Ingresá el total de dinero contado en caja.',
        confirmButtonColor: '#ffc107',
        color: '#fff',
        background: '#14161c',
      });
      return;
    }

    const totalCaja = Number(this.totalCajaContada);
    if (totalCaja < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'El total de caja no puede ser negativo.',
        confirmButtonColor: '#ffc107',
        color: '#fff',
        background: '#14161c',
      });
      return;
    }

    // 3. CONFIRMACIÓN (Preguntar antes de enviar)
    Swal.fire({
      title: '¿Confirmar cierre?',
      text: `Vas a cerrar con $${totalCaja} en caja y ${items.length} productos contados.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar día',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffd60a', // Amarillo primario
      cancelButtonColor: '#d33',
      color: '#fff',
      background: '#14161c',
    }).then((result) => {
      if (result.isConfirmed) {
        // 4. ESTADO DE CARGA (Loading...)
        this.guardando = true;

        // Muestra un spinner y bloquea la pantalla
        Swal.fire({
          title: 'Guardando cierre...',
          text: 'Por favor esperá',
          allowOutsideClick: false,
          color: '#fff',
          background: '#14161c',
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // 5. LLAMADA AL SERVICIO
        this.cierresService
          .crearCierre({
            fecha: this.fecha,
            items,
            totalCajaContada: totalCaja,
          })
          .subscribe({
            next: () => {
              this.guardando = false;

              // 6. ÉXITO
              Swal.fire({
                title: '¡Cierre guardado!',
                text: 'La caja del día ha sido cerrada correctamente.',
                icon: 'success',
                confirmButtonColor: '#ffd60a',
                color: '#fff',
                background: '#14161c',
              });

              // Limpieza
              this.totalCajaContada = null;
              this.rows = this.rows.map((r) => ({ ...r, stockContado: null }));
              this.cargarTotalDelDia(); // Recargar datos si es necesario
            },
            error: (e) => {
              this.guardando = false;

              // 7. ERROR
              Swal.fire({
                title: 'Error',
                text: e?.error?.message ?? 'No se pudo guardar el cierre.',
                icon: 'error',
                confirmButtonColor: '#d33',
                color: '#fff',
                background: '#14161c',
              });
            },
          });
      }
    });
  }
  cargarTotalDelDia() {
    this.cargandoTotal = true;
    this.totalVentasTeorico = null;

    this.statsService
      .getResumen({ from: this.fecha, to: this.fecha })
      .subscribe({
        next: (res) => {
          this.totalVentasTeorico = res.totalFacturado ?? 0;
          this.cargandoTotal = false;
        },
        error: () => {
          this.cargandoTotal = false;
          this.totalVentasTeorico = null;
        },
      });
  }
}
