import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CierreDetalleComponent } from './cierre-detalle.component';

describe('CierreDetalleComponent', () => {
  let component: CierreDetalleComponent;
  let fixture: ComponentFixture<CierreDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CierreDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CierreDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
