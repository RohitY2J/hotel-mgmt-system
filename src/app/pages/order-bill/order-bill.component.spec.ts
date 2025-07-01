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

    // Set up spies before component instantiation
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

      // Mock HttpService.httpPost for all relevant endpoints
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'order/getCustomerName') {
          return of({ data: ['Customer1', 'Customer2'] });
        } else if (url === 'order/getOrders') {
          return of({ data: [
            { _id: '1', customerName: 'Customer1', status: 0 },
            { _id: '2', customerName: 'Customer2', status: 1 }
          ] });
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
      spyOn(component, 'triggerNotification'); // Spy on notification to ensure it's not called

      // Mock HttpService.httpPost for all relevant endpoints
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'order/getCustomerName') {
          return of({ data: ['Customer1', 'Customer2'] });
        } else if (url === 'order/getOrders') {
          return of({ data: [
            { _id: '1', customerName: 'Customer1', status: 0 },
            { _id: '2', customerName: 'Customer2', status: 1 }
          ] });
        } else if (url === 'table/getTables') {
          return of({ data: [] });
        }
        return of({});
      });

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
        } else if (url === 'order/getCustomerName') {
          return of({ data: ['Customer1', 'Customer2'] });
        } else if (url === 'table/getTables') {
          return of({ data: [] });
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
      //expect(component.showNotification).toBeTrue(); // Notification should be shown
      expect(component.triggerNotification).toHaveBeenCalledWith({
        error: true,
        message: 'Failed to retrieve orders'
      });
      expect(component.orders).toEqual([]); // Orders should remain empty
    }));
  });
});