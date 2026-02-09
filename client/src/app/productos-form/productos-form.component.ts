import { Component, inject, signal } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-productos-form',
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './productos-form.component.html',
  styleUrl: './productos-form.component.scss',
})
export class ProductosFormComponent {
  esEdicion = signal(false);
  id: string | null = null;
  form!: FormGroup;

  private snackBar = inject(MatSnackBar);

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
      precioVenta: [, [Validators.required, Validators.min(0)]],
      costo: [, [Validators.min(0)]],
      stockActual: [, [Validators.required, Validators.min(0)]],
      stockMinimo: [, [Validators.required, Validators.min(0)]],
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
        next: () => {
          (this.router.navigateByUrl('/app/productos'),
            this.snackBar.open(`¡Productos Actualizado! `, 'Cerrar', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['custom-snackbar'], // Opcional para estilos CSS
            }));
        },
        error: () => alert('No se pudo actualizar'),
      });
    } else {
      this.productosService.create(data as any).subscribe({
        next: () => {
          (this.router.navigateByUrl('/app/productos'),
            this.snackBar.open(`¡Producto Creado! `, 'Cerrar', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['custom-snackbar'], // Opcional para estilos CSS
            }));
        },
        error: () => alert('No se pudo crear'),
      });
    }
  }

  volver() {
    this.router.navigateByUrl('/app/productos');
  }
}
