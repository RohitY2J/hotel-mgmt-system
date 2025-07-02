import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { WaiterComponent } from './waiter.component';
import { HttpService } from '../../services/http-service.service';
import { ConstantsService } from '../../services/constants.service';
import { AuthService } from '../../services/auth.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';

describe('WaiterComponent', () => {
  let component: WaiterComponent;
  let fixture: ComponentFixture<WaiterComponent>;
  let httpService: HttpService;
  let constantsService: ConstantsService;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        WaiterComponent,
        NotificationComponent,
        LoaderComponent,
        HttpClientTestingModule,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgMultiSelectDropDownModule,
        NgSelectModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        HttpService,
        {
          provide: ConstantsService,
          useValue: {
            getStatusString: jasmine.createSpy('getStatusString').and.returnValue('Available'),
            getStatusValuesAsDictionary: jasmine.createSpy('getStatusValuesAsDictionary').and.returnValue([
              { key: 1, value: 'Available' },
              { key: 2, value: 'Processing' }
            ])
          }
        },
        {
          provide: AuthService,
          useValue: {
            getUser: jasmine.createSpy('getUser').and.returnValue({ id: 'user1', name: 'Test Waiter' }),
            logout: jasmine.createSpy('logout')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WaiterComponent);
    component = fixture.componentInstance;
    httpService = TestBed.inject(HttpService);
    constantsService = TestBed.inject(ConstantsService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);

    // Debug logs
    spyOn(console, 'log').and.callThrough();
    spyOn(console, 'warn').and.callThrough();
  });

  describe('ngOnInit', () => {
    it('should initialize component and fetch orders', fakeAsync(() => {
      // Arrange
      const mockOrders = [{ _id: 'order1', status: 1, tableNumber: '1' }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ data: mockOrders }));

      // Act
      component.ngOnInit();
      tick();

      // Assert
      expect(authService.getUser).toHaveBeenCalled();
      expect(component.userDetails).toEqual({ id: 'user1', name: 'Test Waiter' });
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.orders).toEqual(mockOrders);
      expect(component.isLoading).toBeFalse();
      expect(component.orderForm.value).toEqual({
        orderId: '',
        status: ''
      });
    }));

    it('should handle error during order fetch', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.returnValue(throwError(() => new Error('Fetch failed')));

      // Act
      component.ngOnInit();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Failed to retrieve data', error: true });
      expect(component.isLoading).toBeFalse();
      expect(component.orders).toEqual([]);
    }));
  });

  describe('fetchOrder', () => {
    it('should fetch orders and update state', fakeAsync(() => {
      // Arrange
      const mockOrders = [{ _id: 'order1', status: 1, tableNumber: '1' }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ data: mockOrders }));

      // Act
      component.fetchOrder();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.orders).toEqual(mockOrders);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error and show notification', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.returnValue(throwError(() => new Error('Fetch failed')));

      // Act
      component.fetchOrder();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Failed to retrieve data', error: true });
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('openStatusUpdateForm', () => {
    it('should set form values and open modal', fakeAsync(() => {
      // Arrange
      const order = { _id: 'order1', status: 1 };
      component.ngOnInit(); // Initialize orderForm

      // Act
      component.openStatusUpdateForm(order);
      tick();

      // Assert
      expect(component.orderForm.value).toEqual({
        orderId: 'order1',
        status: 1
      });
      expect(component.isOrderFormOpen).toBeTrue();
    }));
  });

  describe('onSubmit', () => {
    it('should submit order status update when form is valid', fakeAsync(() => {
      // Arrange
      component.ngOnInit(); // Initialize orderForm
      component.orderForm.setValue({
        orderId: 'order1',
        status: 2
      });
      spyOn(httpService, 'httpPost').and.returnValue(of({}));
      spyOn(component, 'fetchOrder');
      spyOn(component, 'closeModal');

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/updateStatus', component.orderForm.value);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Order status updated successfully', error: false });
      expect(component.fetchOrder).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error during status update', fakeAsync(() => {
      // Arrange
      component.ngOnInit(); // Initialize orderForm
      component.orderForm.setValue({
        orderId: 'order1',
        status: 2
      });
      spyOn(httpService, 'httpPost').and.returnValue(throwError(() => new Error('Update failed')));

      // Act
      component.onSubmit();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/updateStatus', component.orderForm.value);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Failed to retrieve data', error: true });
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('closeModal', () => {
    it('should reset form and close modal', fakeAsync(() => {
      // Arrange
      component.ngOnInit(); // Initialize orderForm
      component.orderForm.setValue({
        orderId: 'order1',
        status: 1
      });
      component.isOrderFormOpen = true;

      // Act
      component.closeModal();
      tick();

      // Assert
      expect(component.isOrderFormOpen).toBeFalse();
      expect(component.orderForm.value).toEqual({
        orderId: '',
        status: ''
      });
    }));
  });

  describe('addOrderButtonClicked', () => {
    it('should navigate to /order', () => {
      // Arrange
      spyOn(router, 'navigate');

      // Act
      component.addOrderButtonClicked();

      // Assert
      expect(router.navigate).toHaveBeenCalledWith(['/order']);
    });
  });

  describe('logout', () => {
    it('should call AuthService.logout', () => {
      // Act
      component.logout();

      // Assert
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('getStatusString', () => {
    it('should return status string from ConstantsService', () => {
      // Arrange
      (constantsService.getStatusString as jasmine.Spy).and.returnValue('Processing');

      // Act
      const result = component.getStatusString(2);

      // Assert
      expect(constantsService.getStatusString).toHaveBeenCalledWith('orderStatus', 2);
      expect(result).toBe('Processing');
    });
  });

  describe('getOrderStatus', () => {
    it('should return status dictionary from ConstantsService', () => {
      // Act
      const result = component.getOrderStatus();

      // Assert
      expect(constantsService.getStatusValuesAsDictionary).toHaveBeenCalledWith('orderStatus');
      expect(result).toEqual([{ key: 1, value: 'Available' }, { key: 2, value: 'Processing' }]);
    });
  });

  describe('triggerNotification', () => {
    it('should set notification parameters and show notification', () => {
      // Arrange
      const notification = { message: 'Test message', error: false };

      // Act
      component.triggerNotification(notification);

      // Assert
      expect(component.notificationParams).toEqual(notification);
      expect(component.showNotification).toBeTrue();
    });
  });
});