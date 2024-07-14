import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodInvoiceLayoutComponent } from './food-invoice-layout.component';

describe('FoodInvoiceLayoutComponent', () => {
  let component: FoodInvoiceLayoutComponent;
  let fixture: ComponentFixture<FoodInvoiceLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodInvoiceLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodInvoiceLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
