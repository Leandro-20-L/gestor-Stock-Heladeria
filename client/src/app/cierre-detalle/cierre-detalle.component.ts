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

    const dif =
      this.cierre.diferenciaEfectivo ?? this.cierre.diferenciaCaja ?? 0;

    const efectivoContado =
      this.cierre.efectivoContado ?? this.cierre.totalCajaContada ?? 0;

    const resumen = [
      { Campo: 'Fecha', Valor: this.cierre.fecha },
      {
        Campo: 'Efectivo sistema',
        Valor: this.cierre.totalEfectivoSistema ?? 0,
      },
      {
        Campo: 'Efectivo contado',
        Valor: efectivoContado,
      },
      {
        Campo: 'Diferencia efectivo',
        Valor: dif,
      },
      {
        Campo: 'Transferencia sistema',
        Valor: this.cierre.totalTransferenciaSistema ?? 0,
      },
      {
        Campo: 'Point sistema',
        Valor: this.cierre.totalPointSistema ?? 0,
      },
      {
        Campo: 'Total sistema',
        Valor: this.cierre.totalVentasTeorico ?? 0,
      },
    ];

    const wsResumen = XLSX.utils.json_to_sheet(resumen);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    if (this.cierre.items && this.cierre.items.length > 0) {
      const detalle = this.cierre.items.map((it) => ({
        Producto: it.productoId.nombre,
        Teorico: it.stockTeorico,
        Contado: it.stockContado,
        Diferencia: it.diferencia,
      }));

      const wsDetalle = XLSX.utils.json_to_sheet(detalle);
      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Stock');
    }

    XLSX.writeFile(wb, `cierre_${this.cierre.fecha}.xlsx`);
  }
}
