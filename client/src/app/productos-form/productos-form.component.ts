import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductoService } from '../services/producto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Categoria, Unidad } from '../productos/producto.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-productos-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './productos-form.component.html',
  styleUrl: './productos-form.component.scss',
})
export class ProductosFormComponent {
  esEdicion = signal(false);
  id: string | null = null;
  form!: FormGroup;

  debug = false;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductoService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      categoria: ['helado' as Categoria, [Validators.required]],
      unidad: ['kg' as Unidad, [Validators.required]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      costo: [0, [Validators.min(0)]],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
    });
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.esEdicion.set(true);
      this.productosService.getById(this.id).subscribe({
        next: (p) => this.form.patchValue(p),
        error: () => alert('No se pudo cargar el producto'),
      });
    }
  }

  guardar() {
    const data = this.form.getRawValue();

    if (this.id) {
      this.productosService.update(this.id, data).subscribe({
        next: () => this.router.navigateByUrl('/productos'),
        error: () => alert('No se pudo actualizar'),
      });
    } else {
      this.productosService.create(data as any).subscribe({
        next: () => this.router.navigateByUrl('/productos'),
        error: () => alert('No se pudo crear'),
      });
    }
  }

  volver() {
    this.router.navigateByUrl('/productos');
  }
}
