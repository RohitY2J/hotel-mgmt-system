import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FoodInvoiceLayoutComponent } from './food-invoice-layout.component';
import { HttpService } from '../../services/http-service.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';

describe('FoodInvoiceLayoutComponent', () => {
  let component: FoodInvoiceLayoutComponent;
  let fixture: ComponentFixture<FoodInvoiceLayoutComponent>;
  let mockHttpService: jasmine.SpyObj<HttpService>;
  let mockActivatedRoute: { snapshot: { queryParamMap: { get: jasmine.Spy } } };

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj('HttpService', ['httpPost']);
    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue('123')
        }
      }
    };

    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FoodInvoiceLayoutComponent
      ],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FoodInvoiceLayoutComponent);
    component = fixture.componentInstance;
    spyOn(localStorage, 'getItem').and.returnValue('Test Client');
    spyOn(window, 'print');
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize properties and call getOrderForBilling on ngOnInit', async () => {
    const mockResponse = {
      data: [{
        orders: [{ price: 10, qty: 2 }, { price: 20, qty: 1 }],
        bill: { discountType: 0, discountPercent: 10, taxPercent: 5 }
      }]
    };
    mockHttpService.httpPost.and.returnValue(of(mockResponse));
    
    await component.ngOnInit();
    
    expect(localStorage.getItem).toHaveBeenCalledWith('clientName');
    expect(component.clientName).toBe('Test Client');
    expect(mockActivatedRoute.snapshot.queryParamMap.get).toHaveBeenCalledWith('id');
    expect(component.filter.id).toBe('123');
    expect(mockHttpService.httpPost).toHaveBeenCalledWith('order/getOrderBills', { id: '123' });
  });

  describe('getOrderForBilling', () => {
    it('should fetch order bills and calculate amounts for percentage-based discount', () => {
      const mockResponse = {
        data: [{
          orders: [{ price: 100, qty: 2 }, { price: 50, qty: 1 }],
          bill: { discountType: 0, discountPercent: 10, taxPercent: 5 }
        }]
      };
      mockHttpService.httpPost.and.returnValue(of(mockResponse));
      
      component.getOrderForBilling();
      
      expect(mockHttpService.httpPost).toHaveBeenCalledWith('order/getOrderBills', component.filter);
      expect(component.table).toEqual(mockResponse.data[0]);
      expect(component.amount.subTotal).toBe(250); // (100 * 2) + (50 * 1)
      expect(component.amount.discountAmt).toBe(25); // 10% of 250
      expect(component.amount.taxAmt).toBe(11.25); // 5% of (250 - 25)
      expect(component.amount.totalPayable).toBe(236.25); // 250 - 25 + 11.25
    });

    it('should fetch order bills and calculate amounts for fixed discount', () => {
      const mockResponse = {
        data: [{
          orders: [{ price: 100, qty: 2 }, { price: 50, qty: 1 }],
          bill: { discountType: 1, discountAmt: 50, taxAmt: 20 }
        }]
      };
      mockHttpService.httpPost.and.returnValue(of(mockResponse));
      
      component.getOrderForBilling();
      
      expect(mockHttpService.httpPost).toHaveBeenCalledWith('order/getOrderBills', component.filter);
      expect(component.table).toEqual(mockResponse.data[0]);
      expect(component.amount.subTotal).toBe(250); // (100 * 2) + (50 * 1)
      expect(component.amount.discountAmt).toBe(50); // Fixed discount
      expect(component.amount.taxAmt).toBe(20); // Fixed tax
      expect(component.amount.totalPayable).toBe(220); // 250 - 50 + 20
    });

    it('should log error on HTTP failure', () => {
      mockHttpService.httpPost.and.returnValue(throwError(() => new Error('Failed')));
      spyOn(console, 'log');
      
      component.getOrderForBilling();
      
      expect(console.log).toHaveBeenCalledWith(jasmine.any(Error));
    });
  });
});