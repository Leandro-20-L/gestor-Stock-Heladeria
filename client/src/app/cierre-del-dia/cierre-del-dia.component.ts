import { Component } from '@angular/core';
import { CierresService } from '../services/cierres.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StatsService } from '../services/stats.service';
import Swal from 'sweetalert2';

type Medio = 'efectivo' | 'transferencia' | 'point';

@Component({
  selector: 'app-cierre-del-dia',
  imports: [FormsModule, CommonModule],
  templateUrl: './cierre-del-dia.component.html',
  styleUrl: './cierre-del-dia.component.scss',
})
export class CierreDelDiaComponent {
  fecha = this.fechaLocalArgentina();

  guardando = false;
  cargandoTotal = false;

  totalEfectivoSistema = 0;
  totalTransferenciaSistema = 0;
  totalPointSistema = 0;
  totalSistema = 0;

  efectivoContado: number | null = null;

  constructor(
    private cierresService: CierresService,
    private statsService: StatsService,
  ) {}

  ngOnInit() {
    this.cargarTotalDelDia();
  }

  private fechaLocalArgentina() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  get diferenciaEfectivo() {
    if (this.efectivoContado === null) return null;
    return Number(this.efectivoContado) - Number(this.totalEfectivoSistema);
  }

  cargarTotalDelDia() {
    this.cargandoTotal = true;

    this.totalEfectivoSistema = 0;
    this.totalTransferenciaSistema = 0;
    this.totalPointSistema = 0;
    this.totalSistema = 0;

    this.statsService
      .getResumen({ from: this.fecha, to: this.fecha })
      .subscribe({
        next: (res) => {
          this.totalEfectivoSistema = this.totalPorMedio(res, 'efectivo');
          this.totalTransferenciaSistema = this.totalPorMedio(
            res,
            'transferencia',
          );
          this.totalPointSistema = this.totalPorMedio(res, 'point');

          this.totalSistema =
            this.totalEfectivoSistema +
            this.totalTransferenciaSistema +
            this.totalPointSistema;

          this.cargandoTotal = false;
        },
        error: () => {
          this.cargandoTotal = false;

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las ventas del día.',
            confirmButtonColor: '#d33',
            color: '#fff',
            background: '#14161c',
          });
        },
      });
  }

  private totalPorMedio(res: any, medio: Medio) {
    return res.porMedioPago?.find((x: any) => x.medio === medio)?.total ?? 0;
  }

  guardar() {
    if (
      this.efectivoContado === null ||
      Number.isNaN(Number(this.efectivoContado))
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Ingresá el efectivo contado en caja.',
        confirmButtonColor: '#ffc107',
        color: '#fff',
        background: '#14161c',
      });
      return;
    }

    const efectivoContado = Number(this.efectivoContado);

    if (efectivoContado < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'El efectivo contado no puede ser negativo.',
        confirmButtonColor: '#ffc107',
        color: '#fff',
        background: '#14161c',
      });
      return;
    }

    const diferenciaEfectivo =
      efectivoContado - Number(this.totalEfectivoSistema);

    Swal.fire({
      title: '¿Confirmar cierre?',
      html: `
        <div style="text-align:left">
          <p>Efectivo sistema: <b>$${this.totalEfectivoSistema}</b></p>
          <p>Efectivo contado: <b>$${efectivoContado}</b></p>
          <p>Diferencia efectivo: <b>$${diferenciaEfectivo}</b></p>
          <hr style="border-color: rgba(255,255,255,.15)">
          <p>Transferencia sistema: <b>$${this.totalTransferenciaSistema}</b></p>
          <p>Point sistema: <b>$${this.totalPointSistema}</b></p>
          <p>Total sistema: <b>$${this.totalSistema}</b></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar día',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffd60a',
      cancelButtonColor: '#d33',
      color: '#fff',
      background: '#14161c',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.guardando = true;

      Swal.fire({
        title: 'Guardando cierre...',
        text: 'Por favor esperá',
        allowOutsideClick: false,
        color: '#fff',
        background: '#14161c',
        didOpen: () => Swal.showLoading(),
      });

      this.cierresService
        .crearCierre({
          fecha: this.fecha,
          items: [],
          totalVentasTeorico: this.totalSistema,
          totalCajaContada: efectivoContado,

          totalEfectivoSistema: this.totalEfectivoSistema,
          totalTransferenciaSistema: this.totalTransferenciaSistema,
          totalPointSistema: this.totalPointSistema,

          efectivoContado,
          diferenciaEfectivo,
          diferenciaCaja: diferenciaEfectivo,
        } as any)
        .subscribe({
          next: () => {
            this.guardando = false;

            Swal.fire({
              title: '¡Cierre guardado!',
              text: 'El cierre de caja fue guardado correctamente.',
              icon: 'success',
              confirmButtonColor: '#ffd60a',
              color: '#fff',
              background: '#14161c',
            });

            this.efectivoContado = null;
            this.cargarTotalDelDia();
          },
          error: (e) => {
            this.guardando = false;

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
    });
  }
}
