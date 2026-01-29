import { Component } from '@angular/core';
import { Producto } from '../productos/producto.model';
import { ProductoService } from '../services/producto.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resumen',
  imports: [FormsModule, CommonModule],
  templateUrl: './resumen.component.html',
  styleUrl: './resumen.component.scss',
})
export class ResumenComponent {
  productosStockBajo: Producto[] = [];

  constructor(private productosService: ProductoService) {}

  ngOnInit() {
    this.productosService.getProductosStockBajo().subscribe({
      next: (prods) => (this.productosStockBajo = prods),
    });
  }
}
