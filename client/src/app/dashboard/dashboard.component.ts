import { Component, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import {
  ChildrenOutletContexts,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { zoomAnimation } from '../route-animations';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [zoomAnimation],
})
export class DashboardComponent {
  private contexts = inject(ChildrenOutletContexts);

  getRouteAnimationData() {
    // Esta función busca la data en los hijos del Dashboard
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.[
      'animation'
    ];
  }
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  logout() {
    this.auth.logout(); // borrar token
    this.router.navigateByUrl('/login');
  }
}
