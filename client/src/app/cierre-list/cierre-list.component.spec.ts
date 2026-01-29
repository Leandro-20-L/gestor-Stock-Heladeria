import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CierreListComponent } from './cierre-list.component';

describe('CierreListComponent', () => {
  let component: CierreListComponent;
  let fixture: ComponentFixture<CierreListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CierreListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CierreListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
