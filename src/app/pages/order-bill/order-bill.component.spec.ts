import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { OrderBillComponent } from './order-bill.component';
import { HttpService } from '../../services/http-service.service';
import { ConstantsService } from '../../services/constants.service';
import { Router } from '@angular/router';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { AutocompleteComponent } from '../shared/autocomplete/autocomplete.component';
import { Datepicker } from 'flowbite';

describe('OrderBillComponent', () => {
  let component: OrderBillComponent;
  let fixture: ComponentFixture<OrderBillComponent>;
  let httpService: HttpService;
  let constantsService: ConstantsService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderBillComponent,
        PaginationComponent,
        NotificationComponent,
        LoaderComponent,
        AutocompleteComponent,
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [
        HttpService,
        ConstantsService,
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    // Inject services before component creation
    constantsService = TestBed.inject(ConstantsService);
    httpService = TestBed.inject(HttpService);
    router = TestBed.inject(Router);

    // Set up spies for constantsService before component instantiation
    const mockStatusValues = [
      { key: 0, value: 'Pending' },
      { key: 1, value: 'Processing' }
    ];
    spyOn(constantsService, 'getStatusValuesAsDictionary').and.returnValue(mockStatusValues);
    spyOn(constantsService, 'getDateTodayString').and.returnValue('07/01/2025');

    // Create component after setting up spies
    fixture = TestBed.createComponent(OrderBillComponent);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should initialize component properties and setup datepicker', fakeAsync(() => {
      // Arrange
      spyOn(component, 'fetchOrders');
      spyOn(component, 'fetchTables');
      spyOn(component.searchControl.valueChanges, 'pipe').and.returnValue(of('test').pipe());
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'order/getCustomerName') {
          return of({ data: ['Customer1', 'Customer2'] });
        } else if (url === 'table/getTables') {
          return of({ data: [] });
        }
        return of({});
      });
      // Mock Datepicker
      spyOn(window as any, 'Datepicker').and.returnValue({
        updateOnHide: jasmine.createSpy('updateOnHide'),
        getDate: () => '07/01/2025'
      });

      // Act
      component.ngOnInit();
      tick(300); // Simulate debounceTime

      // Assert
      expect(constantsService.getStatusValuesAsDictionary).toHaveBeenCalledWith('orderStatus');
      expect(component.orderStatus).toEqual([
        { key: 0, value: 'Pending' },
        { key: 1, value: 'Processing' }
      ]);
      expect(constantsService.getDateTodayString).toHaveBeenCalled();
      expect(component.filter.date).toEqual('07/01/2025');
      expect(component.fetchOrders).toHaveBeenCalled();
      expect(component.fetchTables).toHaveBeenCalled();
      expect(component.filteredOptions).toEqual(['Customer1', 'Customer2']);
    }));
  });

  describe('fetchOrders', () => {
    it('should fetch orders, update state, and handle loading', fakeAsync(() => {
      // Arrange
      const mockOrders = [
        { _id: '1', customerName: 'Customer1', status: 0 },
        { _id: '2', customerName: 'Customer2', status: 1 }
      ];
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'order/getOrders') {
          expect(body).toEqual(component.filter); // Verify filter is sent
          return of({ data: mockOrders });
        }
        return of({});
      });
      spyOn(component, 'triggerNotification'); // Spy on notification to ensure it's not called

      // Act
      component.searchControl.setValue('test'); // Set searchControl to simulate customerName
      component.fetchOrders();
      tick(); // Simulate async completion

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/getOrders', component.filter);
      expect(component.isLoading).toBeFalse(); // Loading should be false after finalize
      expect(component.showNotification).toBeFalse(); // Notification should not be shown
      expect(component.orders).toEqual(mockOrders); // Orders should be updated
      expect(component.filter.pagination.dataCount).toEqual(mockOrders.length); // Data count should match
      expect(component.triggerNotification).not.toHaveBeenCalled(); // No error notification
      expect(component.filter.customerName).toEqual('test'); // Customer name from searchControl
    }));

    it('should handle error and trigger notification', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'order/getOrders') {
          return throwError(() => new Error('Failed to retrieve orders'));
        }
        return of({});
      });
      spyOn(component, 'triggerNotification');

      // Act
      component.fetchOrders();
      tick(); // Simulate async completion

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/getOrders', component.filter);
      expect(component.isLoading).toBeFalse(); // Loading should be false after finalize
      expect(component.triggerNotification).toHaveBeenCalledWith({
        error: true,
        message: 'Failed to retrieve orders'
      });
      expect(component.orders).toEqual([]); // Orders should remain empty
    }));
  });

  describe('checkOut', () => {
    it('should bill order, update states, and close modal on success', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'order/billOrder') {
          return of({ success: true });
        }
        return of({});
      });
      spyOn(component, 'triggerNotification'); // Spy on notification to ensure it's not called
      component.selectedOrder = {
        _id: '1',
        customerName: 'Customer1',
        status: 1,
        paymentType: '0'
      }; // Set selectedOrder

      // Act
      component.checkOut();
      tick(); // Simulate async completion

      // Assert
      expect(component.selectedOrder.status).toEqual(3); // Status should be updated to 'billed'
      expect(httpService.httpPost).toHaveBeenCalledWith('order/billOrder', component.selectedOrder);
      expect(component.isLoading).toBeFalse(); // Loading should be false after finalize
      expect(component.isCheckOutModalVisible).toBeFalse(); // Modal should be closed
      expect(component.triggerNotification).not.toHaveBeenCalled(); // No error notification
    }));

    it('should handle error and trigger notification', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'order/billOrder') {
          return throwError(() => new Error('Failed to print food invoice'));
        }
        return of({});
      });
      spyOn(component, 'triggerNotification');
      component.selectedOrder = {
        _id: '1',
        customerName: 'Customer1',
        status: 1,
        paymentType: '0'
      }; // Set selectedOrder

      // Act
      component.checkOut();
      tick(); // Simulate async completion

      // Assert
      expect(component.selectedOrder.status).toEqual(3); // Status should still be updated
      expect(httpService.httpPost).toHaveBeenCalledWith('order/billOrder', component.selectedOrder);
      expect(component.isLoading).toBeFalse(); // Loading should be false after finalize
      expect(component.isCheckOutModalVisible).toBeFalse(); // Modal should be closed
      expect(component.triggerNotification).toHaveBeenCalledWith({
        message: 'Failed to print food invoice',
        error: true
      });
    }));
  });
  describe('nextStep', () => {
    it('should calculate financial details and increment step for percentage-based discount', () => {
      // Arrange
      component.selectedOrder = {
        orders: [
          { price: 100, qty: 2 },
          { price: 50, qty: 1 }
        ],
        discountType: 0,
        discountPercent: 10,
        taxPercent: 5
      };
      component.currentStep = 0;

      // Act
      component.nextStep();

      // Assert
      expect(component.selectedOrder.subTotal).toEqual(250); // 100*2 + 50*1 = 250
      expect(component.selectedOrder.discountAmt).toEqual(25); // 10% of 250 = 25
      expect(component.selectedOrder.taxAmt).toEqual(11.25); // 5% of (250-25) = 11.25
      expect(component.selectedOrder.totalPayable).toEqual(236.25); // 250 - 25 + 11.25 = 236.25
      expect(component.currentStep).toEqual(1); // Step should increment
    });

    it('should calculate financial details for fixed discount and tax', () => {
      // Arrange
      component.selectedOrder = {
        orders: [
          { price: 100, qty: 2 },
          { price: 50, qty: 1 }
        ],
        discountType: 1,
        discountAmt: 50,
        taxAmt: 20
      };
      component.currentStep = 0;

      // Act
      component.nextStep();

      // Assert
      expect(component.selectedOrder.subTotal).toEqual(250); // 100*2 + 50*1 = 250
      expect(component.selectedOrder.discountAmt).toEqual(50); // Fixed discount = 50
      expect(component.selectedOrder.taxAmt).toEqual(20); // Fixed tax = 20
      expect(component.selectedOrder.totalPayable).toEqual(220); // 250 - 50 + 20 = 220
      expect(component.currentStep).toEqual(1); // Step should increment
    });

    it('should handle undefined discount and tax values', () => {
      // Arrange
      component.selectedOrder = {
        orders: [
          { price: 100, qty: 2 },
          { price: 50, qty: 1 }
        ],
        discountType: 0 // Percentage-based, but no discountPercent or taxPercent
      };
      component.currentStep = 0;

      // Act
      component.nextStep();

      // Assert
      expect(component.selectedOrder.subTotal).toEqual(250); // 100*2 + 50*1 = 250
      expect(component.selectedOrder.discountAmt).toEqual(0); // 0% of 250 = 0 (undefined discountPercent)
      expect(component.selectedOrder.taxAmt).toEqual(0); // 0% of 250 = 0 (undefined taxPercent)
      expect(component.selectedOrder.totalPayable).toEqual(250); // 250 - 0 + 0 = 250
      expect(component.currentStep).toEqual(1); // Step should increment
    });

    it('should not increment step if at the last step', () => {
      // Arrange
      component.selectedOrder = {
        orders: [
          { price: 100, qty: 1 }
        ],
        discountType: 0,
        discountPercent: 0,
        taxPercent: 0
      };
      component.currentStep = 1; // Last step (steps = ['Step 1', 'Step 2'])

      // Act
      component.nextStep();

      // Assert
      expect(component.selectedOrder.subTotal).toEqual(100); // 100*1 = 100
      expect(component.selectedOrder.discountAmt).toEqual(0); // 0% of 100 = 0
      expect(component.selectedOrder.taxAmt).toEqual(0); // 0% of 100 = 0
      expect(component.selectedOrder.totalPayable).toEqual(100); // 100 - 0 + 0 = 100
      expect(component.currentStep).toEqual(1); // Step should not increment
    });
  });

  describe('fetchTables', () => {
    it('should fetch tables and update state', fakeAsync(() => {
      // Arrange
      const mockTables = [
        { id: '1', number: 'Table 1' },
        { id: '2', number: 'Table 2' }
      ];
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'table/getTables') {
          return of({ data: mockTables });
        }
        return of({});
      });
      spyOn(component, 'triggerNotification');

      // Act
      component.fetchTables();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', {});
      expect(component.isLoading).toBeFalse();
      expect(component.tableNumbers).toEqual(mockTables);
      expect(component.triggerNotification).not.toHaveBeenCalled();
    }));

    it('should handle error and trigger notification', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'table/getTables') {
          return throwError(() => new Error('Failed to table data'));
        }
        return of({});
      });
      spyOn(component, 'triggerNotification');

      // Act
      component.fetchTables();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', {});
      expect(component.isLoading).toBeFalse();
      expect(component.triggerNotification).toHaveBeenCalledWith({
        message: 'Failed to table data',
        error: true
      });
      expect(component.tableNumbers).toEqual([]);
    }));
  });

  describe('clearFilter', () => {
    it('should reset filter, clear searchControl, and fetch orders', () => {
      // Arrange
      component.filter = {
        date: '01/01/2025',
        status: '1',
        tableNumber: 'Table 1',
        customerName: 'Customer1',
        pagination: { page: 2, pageSize: 10, dataCount: 20 }
      };
      component.searchControl.setValue('Customer1');
      spyOn(component, 'fetchOrders');

      // Act
      component.clearFilter();

      // Assert
      expect(component.filter).toEqual({
        date: '07/01/2025',
        status: '',
        tableNumber: '',
        customerName: '',
        pagination: { page: 1, pageSize: 5, dataCount: 5 }
      });
      expect(component.searchControl.value).toBeNull();
      expect(component.fetchOrders).toHaveBeenCalled();
      expect(constantsService.getDateTodayString).toHaveBeenCalled();
    });
  });

  describe('searchButtonClicked', () => {
    it('should trigger fetchOrders', () => {
      // Arrange
      spyOn(component, 'fetchOrders');

      // Act
      component.searchButtonClicked();

      // Assert
      expect(component.fetchOrders).toHaveBeenCalled();
    });
  });

  describe('searchInputChanged', () => {
    it('should do nothing', () => {
      // Arrange
      const event = {} as Event;
      // No spies needed since the method is empty

      // Act
      component.searchInputChanged(event);

      // Assert
      // No assertions needed as the method is empty
      expect(true).toBeTrue(); // Placeholder to ensure test runs
    });
  });

  describe('openCheckOutModal', () => {
    it('should set isCheckOutModalVisible to true', () => {
      // Arrange
      component.isCheckOutModalVisible = false;

      // Act
      component.openCheckOutModal();

      // Assert
      expect(component.isCheckOutModalVisible).toBeTrue();
    });
  });

  describe('closeCheckOutModal', () => {
    it('should set isCheckOutModalVisible to false', () => {
      // Arrange
      component.isCheckOutModalVisible = true;

      // Act
      component.closeCheckOutModal();

      // Assert
      expect(component.isCheckOutModalVisible).toBeFalse();
    });
  });

  describe('updatePaginationPage', () => {
    it('should update pagination page and fetch orders', () => {
      // Arrange
      spyOn(component, 'fetchOrders');
      component.filter.pagination.page = 1;

      // Act
      component.updatePaginationPage(3);

      // Assert
      expect(component.filter.pagination.page).toEqual(3);
      expect(component.fetchOrders).toHaveBeenCalled();
    });
  });

  describe('checkOutAndPrintInvoice', () => {
    it('should navigate to print-food-invoice with order ID', () => {
      // Arrange
      const order = { _id: '123' };

      // Act
      component.checkOutAndPrintInvoice(order);

      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['/print-food-invoice'], {
        queryParams: { id: '123' }
      });
    });
  });

  describe('generateInvoiceClicked', () => {
    it('should set selectedOrder', () => {
      // Arrange
      const order = { _id: '123', customerName: 'Customer1' };
      component.selectedOrder = {};

      // Act
      component.generateInvoiceClicked(order);

      // Assert
      expect(component.selectedOrder).toEqual(order);
    });
  });

  describe('payNow', () => {
    it('should set selectedOrder with paymentType and open checkout modal', () => {
      // Arrange
      const order = { _id: '123', customerName: 'Customer1' };
      component.isCheckOutModalVisible = false;

      // Act
      component.payNow(order);

      // Assert
      expect(component.selectedOrder).toEqual({ ...order, paymentType: '0' });
      expect(component.isCheckOutModalVisible).toBeTrue();
    });
  });

  describe('getOrderStatus', () => {
    it('should return status string from constantsService', () => {
      // Arrange
      spyOn(constantsService, 'getStatusString').and.returnValue('Pending');

      // Act
      const result = component.getOrderStatus(0);

      // Assert
      expect(constantsService.getStatusString).toHaveBeenCalledWith('orderStatus', 0);
      expect(result).toEqual('Pending');
    });
  });

  describe('previousStep', () => {
    it('should decrement step if not at first step', () => {
      // Arrange
      component.currentStep = 1;

      // Act
      component.previousStep();

      // Assert
      expect(component.currentStep).toEqual(0);
    });

    it('should not decrement step if at first step', () => {
      // Arrange
      component.currentStep = 0;

      // Act
      component.previousStep();

      // Assert
      expect(component.currentStep).toEqual(0);
    });
  });

  describe('updateFilterOptions', () => {
    it('should update filteredOptions with customer names', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'order/getCustomerName') {
          return of({ data: ['Customer3', 'Customer4'] });
        }
        return of({});
      });

      // Act
      component.updateFilterOptions('test');
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/getCustomerName', { filterValue: 'test' });
      expect(component.filteredOptions).toEqual(['Customer3', 'Customer4']);
    }));

    it('should handle error and trigger notification', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'order/getCustomerName') {
          return throwError(() => new Error('Failed to get menu names'));
        }
        return of({});
      });
      spyOn(component, 'triggerNotification');

      // Act
      component.updateFilterOptions('test');
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/getCustomerName', { filterValue: 'test' });
      expect(component.filteredOptions).toEqual([]);
      expect(component.triggerNotification).toHaveBeenCalledWith({
        message: 'Failed to get menu names',
        error: true
      });
    }));
  });
});