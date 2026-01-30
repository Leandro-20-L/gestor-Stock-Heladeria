import { Component, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  enviando = false;
  errorMsg = '';
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);
  registerForm = this.fb.group({
    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  get nombreCtrl() {
    return this.registerForm.get('nombre');
  }
  get emailCtrl() {
    return this.registerForm.get('email');
  }
  get passwordCtrl() {
    return this.registerForm.get('password');
  }

  onRegister() {
    console.log(
      'Botón presionado. Estado del formulario:',
      this.registerForm.valid,
    ); // <--- AGREGA ESTO
    this.errorMsg = '';
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toast.warning('Por favor completa todos los campos', 'Atención'); // <--- Uso simple
      return;
    }

    const { nombre, email, password } = this.registerForm.value;

    this.enviando = true;

    this.authService.register(nombre!, email!, password!).subscribe({
      next: () => {
        this.enviando = false;
        this.toast.success('¡Registro exitoso! Redirigiendo...', 'Éxito'); // <--- Mensaje verde
        this.router.navigateByUrl('/login');
      },
      error: (e) => {
        this.enviando = false;
        this.toast.error(e?.error?.message || 'No se pudo registrar', 'Error'); // <--- Mensaje rojo
      },
    });
  }
}
