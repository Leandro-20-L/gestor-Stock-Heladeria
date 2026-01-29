import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentasListComponent } from './ventas-list.component';

describe('VentasListComponent', () => {
  let component: VentasListComponent;
  let fixture: ComponentFixture<VentasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
