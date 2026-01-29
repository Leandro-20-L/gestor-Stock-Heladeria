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
    this.errorMsg = '';
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { nombre, email, password } = this.registerForm.value;

    this.enviando = true;

    this.authService.register(nombre!, email!, password!).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigateByUrl('/login');
      },
      error: (e) => {
        this.enviando = false;
        this.errorMsg = e?.error?.message ?? 'No se pudo registrar';
      },
    });
  }
}
