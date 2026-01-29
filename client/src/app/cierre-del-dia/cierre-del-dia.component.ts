import { Component } from '@angular/core';
import { ProductoService } from '../services/producto.service';
import { CierresService } from '../services/cierres.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../productos/producto.model';

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

  constructor(
    private productosService: ProductoService,
    private cierresService: CierresService,
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
  }

  diferencia(r: Row) {
    if (r.stockContado === null) return null;
    return Number(r.stockContado) - Number(r.stockActual);
  }

  guardar() {
    // Solo los que el usuario completó
    const items = this.rows
      .filter((r) => r.stockContado !== null)
      .map((r) => ({
        productoId: r._id,
        stockContado: Number(r.stockContado),
      }));

    if (items.length === 0) return;

    this.guardando = true;

    this.cierresService.crearCierre({ fecha: this.fecha, items }).subscribe({
      next: () => {
        this.guardando = false;
        alert('Cierre guardado ✅');
      },
      error: (e) => {
        this.guardando = false;
        alert(e?.error?.message ?? 'Error al guardar cierre');
      },
    });
  }
}
