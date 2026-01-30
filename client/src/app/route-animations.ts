// src/app/route-animations.ts
import {
  trigger,
  transition,
  style,
  query,
  animate,
  group,
} from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true },
    ),
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    group([
      query(':leave', [animate('300ms ease-out', style({ opacity: 0 }))], {
        optional: true,
      }),
      query(':enter', [animate('300ms ease-out', style({ opacity: 1 }))], {
        optional: true,
      }),
    ]),
  ]),
]);

export const sliderAnimation = trigger('routeAnimations', [
  transition('* => *', [
    // 1. Configuración inicial para que se superpongan
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true },
    ),

    // 2. La página nueva empieza fuera de la pantalla (a la derecha)
    query(':enter', [style({ left: '100%' })], { optional: true }),

    // 3. Animación en grupo (las dos se mueven a la vez)
    group([
      query(
        ':leave',
        [
          animate('400ms ease-out', style({ left: '-100%' })), // La vieja se va a la izquierda
        ],
        { optional: true },
      ),
      query(
        ':enter',
        [
          animate('400ms ease-out', style({ left: '0%' })), // La nueva entra a su sitio
        ],
        { optional: true },
      ),
    ]),
  ]),
]);

// En src/app/route-animations.ts
export const zoomAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true },
    ),

    // La nueva empieza pequeña y transparente
    query(':enter', [style({ transform: 'scale(0.8)', opacity: 0 })], {
      optional: true,
    }),

    group([
      // La vieja se desvanece
      query(
        ':leave',
        [
          animate(
            '300ms ease-out',
            style({ opacity: 0, transform: 'scale(0.5)' }),
          ),
        ],
        { optional: true },
      ),
      // La nueva crece y aparece
      query(
        ':enter',
        [
          animate(
            '300ms ease-out',
            style({ opacity: 1, transform: 'scale(1)' }),
          ),
        ],
        { optional: true },
      ),
    ]),
  ]),
]);
