import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { sliderAnimation } from './route-animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSpinnerComponent],
  templateUrl: './app.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './app.component.scss',
  animations: [sliderAnimation],
})
export class AppComponent {
  // Inyecta el servicio para detectar las rutas
  private contexts = inject(ChildrenOutletContexts);
  title = 'client';

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.[
      'animation'
    ];
  }
}
