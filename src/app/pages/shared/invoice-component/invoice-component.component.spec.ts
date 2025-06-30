import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceComponentComponent } from './invoice-component.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('InvoiceComponentComponent', () => {
  let component: InvoiceComponentComponent;
  let fixture: ComponentFixture<InvoiceComponentComponent>;
  let router: Router;

  // Define mock reservation data
  const getMockReservation = () => ({
    id: '123',
    checkInDate: '2025-06-01',
    checkOutDate: '2025-06-03',
    rooms: [
      { roomNumber: '101', price: 100 },
      { roomNumber: '102', price: 150 }
    ],
    billing: {
      orders: [
        { qty: 2, price: 50 },
        { qty: 1, price: 75 }
      ],
      discountPercentage: 10,
      flatDiscount: 25,
      totalPaidAmount: 200
    }
  });

  beforeEach(async () => {
    // Configure testing module
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule,
        InvoiceComponentComponent
      ]
    }).compileComponents();

    // Initialize component and fixture
    fixture = TestBed.createComponent(InvoiceComponentComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    // Set fresh reservation data and reset values
    component.reservation = getMockReservation();
    component.resetValues(); // Ensure clean state
    component.ngOnChanges(); // Process reservation data
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up component state
    component.reservation = undefined;
    component.resetValues();
    fixture.destroy();
  });

  it('should create', () => {
    // Verify component creation
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    // Create a new component instance to test initial state
    const newFixture = TestBed.createComponent(InvoiceComponentComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    // Verify initial state
    expect(newComponent.rooms).toEqual([]);
    expect(newComponent.discount).toBe(0);
    expect(newComponent.tax).toBe(0);
    expect(newComponent.totalPayable).toBe(0);
    expect(newComponent.subTotal).toBe(0);
    expect(newComponent.roomTotal).toBe(0);
    expect(newComponent.totalPaidAmount).toBe(0);
    expect(newComponent.totalRemainingAmount).toBe(0);
    expect(newComponent.totalRemainingAmountAbs).toBe(0);
  });

  // it('should reset values on ngOnChanges', () => {
  //   // Set some values
  //   component.rooms = [{ roomNumber: 'test', price: 100, qty: 1, total: 100 }, { roomNumber: 'test2', price: 200, qty: 1, total: 200 }];
  //   component.discount = 50;

  //   // Trigger ngOnChanges
  //   component.ngOnChanges();

  //   // Verify values are reset
  //   expect(component.rooms.length).toBe(2); // Expect 2 rooms from mock reservation
  //   expect(component.discount).toBe(75); // Calculated from mock reservation
  // });

  // it('should calculate reservation amount correctly', () => {
  //   // Reset values to ensure clean state
  //   component.resetValues();

  //   // Trigger reservation amount calculation
  //   component.getReservationAmount();

  //   // Verify room calculations (2 days * (100 + 150) = 500)
  //   expect(component.rooms.length).toBe(2); // Should have exactly 2 rooms
  //   expect(component.rooms[0].total).toBe(200); // 100 * 2 days
  //   expect(component.rooms[1].total).toBe(300); // 150 * 2 days
  //   expect(component.roomTotal).toBe(500);

  //   // Verify total calculations (roomTotal + orders - discount)
  //   expect(component.discount).toBe(93); // 10% of 500 + 25 flat
  //   expect(component.totalPayable).toBe(425); // 500 - 75
  //   expect(component.totalPaidAmount).toBe(200);
  //   expect(component.totalRemainingAmount).toBe(225); // 425 - 200
  //   expect(component.totalRemainingAmountAbs).toBe(225);
  // });

  it('should calculate order amount correctly', () => {
    // Trigger order amount calculation
    component.getOrderAmount();

    // Verify order subtotal (2*50 + 1*75 = 175)
    expect(component.subTotal).toBe(175);
  });

  it('should handle ngDoCheck when billing values change', () => {
    // Spy on methods
    spyOn(component, 'resetValues');
    spyOn(component, 'getReservationAmount');
    spyOn(component, 'getOrderAmount');

    // Change billing values
    component.reservation.billing.discountPercentage = 20;
    component.ngDoCheck();

    // Verify methods were called
    expect(component.resetValues).toHaveBeenCalled();
    expect(component.getReservationAmount).toHaveBeenCalled();
    expect(component.getOrderAmount).toHaveBeenCalled();
  });

  it('should not call methods in ngDoCheck when billing values unchanged', () => {
    // Set previous values to match current billing values
    component['previousDscPer'] = component.reservation.billing.discountPercentage;
    component['previousDscFlat'] = component.reservation.billing.flatDiscount;
    component['previousTotal'] = component.reservation.billing.totalPaidAmount;

    // Spy on methods
    spyOn(component, 'resetValues');
    spyOn(component, 'getReservationAmount');
    spyOn(component, 'getOrderAmount');

    // Trigger ngDoCheck with same values
    component.ngDoCheck();

    // Verify methods were not called
    expect(component.resetValues).not.toHaveBeenCalled();
    expect(component.getReservationAmount).not.toHaveBeenCalled();
    expect(component.getOrderAmount).not.toHaveBeenCalled();
  });

  it('should navigate to print-invoice on printInvoice', () => {
    // Call printInvoice
    component.printInvoice();

    // Verify navigation
    expect(router.navigate).toHaveBeenCalledWith(['/print-invoice'], {
      queryParams: { id: '123' }
    });
  });

  it('should handle single day reservation', () => {
    // Create a fresh reservation with same check-in and check-out dates
    component.reservation = {
      ...getMockReservation(),
      checkInDate: '2025-06-01',
      checkOutDate: '2025-06-01'
    };

    // Trigger ngOnChanges to ensure component processes new reservation
    component.ngOnChanges();
    fixture.detectChanges();

    // Verify single day calculation
    expect(component.rooms[0].qty).toBe(1); // Should be 1 day
    expect(component.rooms[0].total).toBe(100); // 100 * 1 day
    expect(component.rooms[1].qty).toBe(1); // Should be 1 day
    expect(component.rooms[1].total).toBe(150); // 150 * 1 day
    expect(component.roomTotal).toBe(250); // 100 + 150
  });

  it('should handle undefined reservation in ngDoCheck', () => {
    // Set reservation to undefined
    component.reservation = undefined;

    // Expect no errors when ngDoCheck is called
    expect(() => component.ngDoCheck()).not.toThrow();
  });
});