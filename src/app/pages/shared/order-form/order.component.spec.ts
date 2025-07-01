import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { OrderFormComponent } from './order-form.component';
import { HttpService } from '../../../services/http-service.service';
import { ConstantsService } from '../../../services/constants.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvoiceComponentComponent } from '../invoice-component/invoice-component.component';
import { of, throwError } from 'rxjs';

describe('OrderFormComponent', () => {
  let component: OrderFormComponent;
  let fixture: ComponentFixture<OrderFormComponent>;
  let mockHttpService: jasmine.SpyObj<HttpService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConstantsService: jasmine.SpyObj<ConstantsService>;

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj('HttpService', ['httpPost', 'httpGet']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConstantsService = jasmine.createSpyObj('ConstantsService', ['getStatusString']);

    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InvoiceComponentComponent,
        RouterModule,
        OrderFormComponent
      ],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: Router, useValue: mockRouter },
        { provide: ConstantsService, useValue: mockConstantsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderFormComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize orders and ordersForm on ngOnInit', () => {
    component.ngOnInit();
    expect(component.orders).toEqual([]);
    expect(component.ordersForm.get('summary')?.value).toBe('');
    expect(component.ordersForm.get('amount')?.value).toBe('');
    expect(component.ordersForm.get('summary')?.hasValidator(Validators.required)).toBeTrue();
    expect(component.ordersForm.get('amount')?.hasValidator(Validators.required)).toBeTrue();
  });

  it('should set orders from reservation.billing.orders on ngOnChanges', () => {
    component.reservation = { billing: { orders: [{ id: 1, amount: 100 }] } };
    component.ngOnChanges();
    expect(component.orders).toEqual([{ id: 1, amount: 100 }]);
    expect(component.ordersForm.pristine).toBeTrue();
  });

  it('should set orders to empty array if reservation.billing.orders is null or undefined', () => {
    component.reservation = { billing: {} };
    component.ngOnChanges();
    expect(component.orders).toEqual([]);
    expect(component.ordersForm.pristine).toBeTrue();
  });

  describe('submitOrder', () => {
    it('should emit notification and not call httpPost if form is invalid', () => {
      spyOn(component.showNotification, 'emit');
      component.ordersForm.setValue({ summary: '', amount: '' });
      component.submitOrder();
      expect(component.showNotification.emit).toHaveBeenCalledWith({
        message: 'Invalid form. Please fill all the required fields.',
        error: true
      });
      expect(mockHttpService.httpPost).not.toHaveBeenCalled();
    });

    it('should call httpPost and emit events on valid form submission', () => {
      spyOn(component.showNotification, 'emit');
      spyOn(component.updateReservation, 'emit');
      component.reservation = { id: 1, billing: { orders: [] } };
      component.ordersForm.setValue({ summary: 'Test order', amount: '100' });
      mockHttpService.httpPost.and.returnValue(of({}));
      
      component.submitOrder();
      
      expect(mockHttpService.httpPost).toHaveBeenCalledWith('reservation/addCustomerOrders', {
        id: 1,
        orders: { summary: 'Test order', amount: '100' }
      });
      expect(component.showNotification.emit).toHaveBeenCalledWith({
        message: 'Order placed.',
        error: false
      });
      expect(component.updateReservation.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateSelection', () => {
    it('should call httpGet and update reservation', () => {
      component.reservation = { id: 1 };
      const mockResponse = { id: 1, billing: { orders: [{ id: 2, amount: 200 }] } };
      mockHttpService.httpGet.and.returnValue(of(mockResponse));
      
      component.updateSelection();
      
      expect(mockHttpService.httpGet).toHaveBeenCalledWith('reservation/getReservationById?id=1');
      expect(component.reservation).toEqual(mockResponse);
    });
  });

  describe('close', () => {
    it('should emit closeForm event', () => {
      spyOn(component.closeForm, 'emit');
      component.close();
      expect(component.closeForm.emit).toHaveBeenCalled();
    });
  });

  describe('getOrderAmount', () => {
    it('should return sum of order amounts', () => {
      component.reservation = { billing: { orders: [{ amount: 100 }, { amount: 200 }] } };
      expect(component.getOrderAmount()).toBe(300);
    });

    it('should return 0 if orders is empty', () => {
      component.reservation = { billing: { orders: [] } };
      expect(component.getOrderAmount()).toBe(0);
    });
  });

  describe('openCheckOutModal', () => {
    it('should set isCheckOutModalVisible to true', () => {
      component.openCheckOutModal();
      expect(component.isCheckOutModalVisible).toBeTrue();
    });
  });

  describe('closeCheckOutModal', () => {
    it('should set isCheckOutModalVisible to false', () => {
      component.isCheckOutModalVisible = true;
      component.closeCheckOutModal();
      expect(component.isCheckOutModalVisible).toBeFalse();
    });
  });

  describe('checkOutAndPrintInvoice', () => {
    it('should update reservation and navigate to print-invoice', () => {
      component.reservation = { id: 1, billing: { discountPercentage: 0, taxPercentage: 0 }, status: 0 };
      component.discount = 10;
      component.tax = 5;
      mockHttpService.httpPost.and.returnValue(of({}));
      
      component.checkOutAndPrintInvoice();
      
      expect(component.reservation.billing.discountPercentage).toBe(10);
      expect(component.reservation.billing.taxPercentage).toBe(5);
      expect(component.reservation.status).toBe(2);
      expect(mockHttpService.httpPost).toHaveBeenCalledWith('reservation/updateReservation', component.reservation);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/print-invoice'], { queryParams: { id: 1 } });
    });

    it('should log error on failure', () => {
      spyOn(console, 'log');
      component.reservation = { id: 1, billing: {}, status: 0 };
      mockHttpService.httpPost.and.returnValue(throwError(() => new Error('Failed')));
      
      component.checkOutAndPrintInvoice();
      
      expect(console.log).toHaveBeenCalled();
    });
  });
});