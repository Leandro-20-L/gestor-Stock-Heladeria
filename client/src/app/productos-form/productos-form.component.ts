import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductoService } from '../services/producto.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Categoria, Producto, TipoItem, Unidad } from '../productos/producto.model';
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

  productosInsumos: Producto[] = [];

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
      tipo: ['producto' as TipoItem, [Validators.required]],
      categoria: ['helado' as Categoria, [Validators.required]],
      unidad: ['kg' as Unidad, [Validators.required]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      precioPoint: [, [Validators.min(0)]],
      costo: [, [Validators.min(0)]],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      descuentaStock: this.fb.array([]),
    });

    // Ajustar validaciones automáticamente según sea 'producto' o 'insumo'
    this.form.get('tipo')?.valueChanges.subscribe((tipo: TipoItem) => {
      const precioCtrl = this.form.get('precioVenta');
      if (tipo === 'insumo') {
        this.form.get('categoria')?.setValue('materia_prima');
        precioCtrl?.clearValidators();
        precioCtrl?.setValidators([Validators.min(0)]);
        precioCtrl?.setValue(0);
        this.descuentaStock.clear(); // Un insumo no descuenta otros insumos
      } else {
        this.form.get('categoria')?.setValue('helado');
        precioCtrl?.setValidators([Validators.required, Validators.min(0)]);
      }
      precioCtrl?.updateValueAndValidity();
    });

    // Cargamos solo los INSUMOS activos para el desplegable de "Descuenta stock"
    this.productosService.getAll({ tipo: 'insumo', activos: true } as any).subscribe({
      next: (insumos) => {
        this.productosInsumos = insumos;
      },
    });

    this.id = this.route.snapshot.paramMap.get('id');

    if (this.id) {
      this.esEdicion.set(true);
      this.productosService.getById(this.id).subscribe({
        next: (p) => {
          this.form.patchValue({
            nombre: p.nombre,
            tipo: p.tipo ?? 'producto',
            categoria: p.categoria,
            unidad: p.unidad,
            precioVenta: p.precioVenta ?? 0,
            precioPoint: p.precioPoint,
            costo: p.costo,
            stockActual: p.stockActual,
            stockMinimo: p.stockMinimo,
          });

          this.descuentaStock.clear();

          for (const d of p.descuentaStock ?? []) {
            this.descuentaStock.push(
              this.fb.group({
                productoId: [d.productoId, Validators.required],
                cantidad: [
                  d.cantidad,
                  [Validators.required, Validators.min(0.001)],
                ],
              }),
            );
          }
        },
        error: () => alert('No se pudo cargar el registro'),
      });
    }
  }

  get esInsumo(): boolean {
    return this.form?.get('tipo')?.value === 'insumo';
  }

  get descuentaStock(): FormArray {
    return this.form.get('descuentaStock') as FormArray;
  }

  agregarInsumo() {
    this.descuentaStock.push(
      this.fb.group({
        productoId: ['', Validators.required],
        cantidad: [1, [Validators.required, Validators.min(0.001)]],
      }),
    );
  }

  quitarInsumo(index: number) {
    this.descuentaStock.removeAt(index);
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data = this.form.getRawValue();

    if (this.id) {
      this.productosService.update(this.id, data).subscribe({
        next: () => {
          this.router.navigateByUrl('/app/productos');
          this.snackBar.open(`¡Registro actualizado!`, 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['custom-snackbar'],
          });
        },
        error: () => alert('No se pudo actualizar'),
      });
    } else {
      this.productosService.create(data as any).subscribe({
        next: () => {
          this.router.navigateByUrl('/app/productos');
          this.snackBar.open(`¡Registro creado!`, 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['custom-snackbar'],
          });
        },
        error: () => alert('No se pudo crear'),
      });
    }
  }

  volver() {
    this.router.navigateByUrl('/app/productos');
  }
}