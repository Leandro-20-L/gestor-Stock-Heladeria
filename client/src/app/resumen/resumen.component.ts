import { Component, signal } from '@angular/core';
import { Producto } from '../productos/producto.model';
import { ProductoService } from '../services/producto.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { StatsResumen, StatsService } from '../services/stats.service';

Chart.register(...registerables);

@Component({
  selector: 'app-resumen',
  imports: [FormsModule, CommonModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.scss',
})
export class ResumenComponent {
  cargando = signal(false);
  data = signal<StatsResumen | null>(null);

  // filtro simple
  from = '';
  to = '';

  private chartDia?: Chart;
  private chartPago?: Chart;
  private chartTop?: Chart;

  constructor(private stats: StatsService) {}

  ngAfterViewInit() {
    // por defecto: últimos 7 días
    const hoy = new Date();
    const desde = new Date();
    desde.setDate(hoy.getDate() - 6);

    this.from = desde.toISOString().slice(0, 10);
    this.to = hoy.toISOString().slice(0, 10);

    this.cargar();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  cargar() {
    this.cargando.set(true);
    this.stats.getResumen({ from: this.from, to: this.to }).subscribe({
      next: (res: any) => {
        this.data.set(res);
        this.cargando.set(false);
        this.renderCharts(res);
      },
      error: () => {
        this.cargando.set(false);
        alert('No se pudo cargar el resumen');
      },
    });
  }

  private destroyCharts() {
    this.chartDia?.destroy();
    this.chartPago?.destroy();
    this.chartTop?.destroy();
    this.chartDia = undefined;
    this.chartPago = undefined;
    this.chartTop = undefined;
  }

  private renderCharts(res: StatsResumen) {
    this.destroyCharts();

    // 1) Por día (línea)
    const labelsDia = res.porDia.map((x) => x.fecha);
    const valuesDia = res.porDia.map((x) => x.total);

    this.chartDia = new Chart('chartDia' as any, {
      type: 'line',
      data: {
        labels: labelsDia,
        datasets: [
          {
            label: 'Total por día',
            data: valuesDia,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
      },
    });

    // 2) Medio de pago (doughnut)
    const labelsPago = res.porMedioPago.map((x) => x.medio);
    const valuesPago = res.porMedioPago.map((x) => x.total);

    this.chartPago = new Chart('chartPago' as any, {
      type: 'doughnut',
      data: {
        labels: labelsPago,
        datasets: [{ label: 'Total por medio', data: valuesPago }],
      },
      options: { responsive: true },
    });

    // 3) Top productos (bar)
    const labelsTop = res.topProductos.map((x) => x.nombre);
    const valuesTop = res.topProductos.map((x) => x.total);

    this.chartTop = new Chart('chartTop' as any, {
      type: 'bar',
      data: {
        labels: labelsTop,
        datasets: [{ label: 'Top productos (total)', data: valuesTop }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { x: { ticks: { autoSkip: false } } },
      },
    });
  }
}
