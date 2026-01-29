import { Component } from '@angular/core';
import { Cierre } from '../cierre-del-dia/cierre.model';
import { CierresService } from '../services/cierres.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cierre-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cierre-list.component.html',
  styleUrl: './cierre-list.component.scss',
})
export class CierreListComponent {
  cierres: Cierre[] = [];
  cargando = false;

  constructor(private cierresService: CierresService) {}

  ngOnInit() {
    this.cargando = true;
    this.cierresService.getAll().subscribe({
      next: (data) => {
        // si el back ya viene ordenado joya; si no:
        this.cierres = (data ?? []).sort((a, b) =>
          a.fecha < b.fecha ? 1 : -1,
        );
        this.cargando = false;
      },
      error: () => (this.cargando = false),
    });
  }
}
