import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderBillComponent } from './order-bill.component';

describe('OrderBillComponent', () => {
  let component: OrderBillComponent;
  let fixture: ComponentFixture<OrderBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderBillComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
