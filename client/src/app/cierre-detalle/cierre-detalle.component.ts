import { Component } from '@angular/core';
import { Cierre } from '../cierre-del-dia/cierre.model';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CierresService } from '../services/cierres.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cierre-detalle',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './cierre-detalle.component.html',
  styleUrl: './cierre-detalle.component.scss',
})
export class CierreDetalleComponent {
  cierre: Cierre | null = null;
  cargando = false;

  constructor(
    private route: ActivatedRoute,
    private cierresService: CierresService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.cargando = true;
    this.cierresService.getById(id).subscribe({
      next: (data) => {
        this.cierre = data;
        this.cargando = false;
      },
      error: () => (this.cargando = false),
    });
  }

  claseDif(dif: number) {
    if (dif === 0) return 'ok';
    return dif > 0 ? 'plus' : 'minus';
  }

  exportarExcel() {
    if (!this.cierre) return;

    // Hoja 1: Resumen caja (lo que te importa del día)
    const resumen = [
      { Campo: 'Fecha', Valor: this.cierre.fecha },
      { Campo: 'Total sistema', Valor: this.cierre.totalVentasTeorico ?? 0 },
      { Campo: 'Total contado', Valor: this.cierre.totalCajaContada ?? 0 },
      { Campo: 'Diferencia', Valor: this.cierre.diferenciaCaja ?? 0 },
      { Campo: 'Productos cargados', Valor: this.cierre.totalProductos ?? 0 },
      { Campo: 'Con diferencias', Valor: this.cierre.conDiferencias ?? 0 },
    ];

    const wsResumen = XLSX.utils.json_to_sheet(resumen);

    // Hoja 2: Detalle (Producto + teórico/contado + diferencia)
    const detalle = this.cierre.items.map((it) => ({
      Producto: it.productoId.nombre,
      Teorico: it.stockTeorico,
      Contado: it.stockContado,
      Diferencia: it.diferencia,
    }));

    const wsDetalle = XLSX.utils.json_to_sheet(detalle);

    // Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

    XLSX.writeFile(wb, `cierre_${this.cierre.fecha}.xlsx`);
  }
}
