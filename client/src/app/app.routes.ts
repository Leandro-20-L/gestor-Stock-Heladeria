import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
    data: { animation: 'LoginPage' },
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./registro/registro.component').then((m) => m.RegistroComponent),
  },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
    data: { animation: 'DashboardPage' },
    children: [
      {
        path: 'resumen',
        loadComponent: () =>
          import('./resumen/resumen.component').then((m) => m.ResumenComponent),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./productos-list/productos-list.component').then(
            (m) => m.ProductosListComponent,
          ),
        data: { animation: 'ProductosPage' },
      },
      {
        path: 'productos/nuevo',
        loadComponent: () =>
          import('./productos-form/productos-form.component').then(
            (m) => m.ProductosFormComponent,
          ),
        data: { animation: 'NewProductosPage' },
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./ventas/ventas-list/ventas-list.component').then(
            (m) => m.VentasListComponent,
          ),
        data: { animation: 'VentasPage' },
      },
      {
        path: 'ventas/nueva',
        loadComponent: () =>
          import('./ventas/ventas-form/ventas-form.component').then(
            (m) => m.VentasFormComponent,
          ),
        data: { animation: 'NewVentaPage' },
      },
      {
        path: 'cierre',
        loadComponent: () =>
          import('./cierre-del-dia/cierre-del-dia.component').then(
            (m) => m.CierreDelDiaComponent,
          ),
        data: { animation: 'CierrePage' },
      },
      {
        path: 'cierres',
        loadComponent: () =>
          import('./cierre-list/cierre-list.component').then(
            (m) => m.CierreListComponent,
          ),
        data: { animation: 'CierresPage' },
      },
      {
        path: 'cierres/:id',
        loadComponent: () =>
          import('./cierre-detalle/cierre-detalle.component').then(
            (m) => m.CierreDetalleComponent,
          ),
        data: { animation: 'CierreIdPage' },
      },

      { path: '', pathMatch: 'full', redirectTo: 'ventas/nueva' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' },
];
