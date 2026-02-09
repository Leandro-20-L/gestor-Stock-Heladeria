import { Component, inject, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  private fb = inject(FormBuilder);
  private spinner = inject(NgxSpinnerService);
  private snackBar = inject(MatSnackBar);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onLogin() {
    this.spinner.show();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.auth.login(email!, password!).subscribe({
      next: (res: any) => {
        this.spinner.hide(); // <-- Ocultar
        const nombre = res.user?.nombre || 'Usuario';

        this.snackBar.open(`¡Hola de nuevo, ${nombre}! 👋`, 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['custom-snackbar'], // Opcional para estilos CSS
        });
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.spinner.hide();
        this.snackBar.open(
          err?.error?.message || 'Credenciales inválidas',
          'X',
          {
            duration: 3000,
            panelClass: ['error-snackbar'],
          },
        );
      },
    });
  }

  irRegistro() {
    this.router.navigateByUrl('/register');
  }
}
