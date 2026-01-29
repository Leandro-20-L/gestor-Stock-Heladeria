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

    const data = this.cierre.items.map((it) => ({
      Producto: it.productoId.nombre, // 👈 nombre, no ID
      'Stock teórico': it.stockTeorico,
      'Stock contado': it.stockContado,
      Diferencia: it.diferencia,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cierre');

    const nombreArchivo = `cierre_${this.cierre.fecha}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  }
}
