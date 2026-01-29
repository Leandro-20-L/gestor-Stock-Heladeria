import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CierreDelDiaComponent } from './cierre-del-dia.component';

describe('CierreDelDiaComponent', () => {
  let component: CierreDelDiaComponent;
  let fixture: ComponentFixture<CierreDelDiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CierreDelDiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CierreDelDiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
