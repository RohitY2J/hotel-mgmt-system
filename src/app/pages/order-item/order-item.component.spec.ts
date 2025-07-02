import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { OrderItemComponent } from './order-item.component';
import { HttpService } from '../../services/http-service.service';
import { AuthService } from '../../services/auth.service';
import { ConstantsService } from '../../services/constants.service';
import { ToastrService } from 'ngx-toastr';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { AutocompleteComponent } from '../shared/autocomplete/autocomplete.component';

// Mock Window interface for window.open
interface MockWindow extends Window {
  open: jasmine.Spy;
  document: Document & {
    write: jasmine.Spy;
    close: jasmine.Spy;
  };
  close: () => void;
  print: () => void;
  onload: (event: Event) => void;
  onafterprint: (event: Event) => void;
}
declare let window: MockWindow;

describe('OrderItemComponent', () => {
  let component: OrderItemComponent;
  let fixture: ComponentFixture<OrderItemComponent>;
  let httpService: HttpService;
  let authService: AuthService;
  let toastrService: ToastrService;
  let mockPrintWindow: Partial<Window> & {
    document: Partial<Document> & { write: jasmine.Spy; close: jasmine.Spy };
    print: jasmine.Spy;
    close: jasmine.Spy;
    onload: jasmine.Spy;
    onafterprint: jasmine.Spy;
  };

  beforeEach(async () => {
    // Mock print window for window.open
    mockPrintWindow = {
      document: {
        write: jasmine.createSpy('write'),
        close: jasmine.createSpy('close')
      },
      print: jasmine.createSpy('print'),
      close: jasmine.createSpy('close'),
      onload: jasmine.createSpy('onload'),
      onafterprint: jasmine.createSpy('onafterprint')
    } as any;

    await TestBed.configureTestingModule({
      imports: [
        OrderItemComponent,
        NotificationComponent,
        LoaderComponent,
        PaginationComponent,
        AutocompleteComponent,
        HttpClientTestingModule,
        CommonModule,
        FormsModule
      ],
      providers: [
        HttpService,
        AuthService,
        ConstantsService,
        { provide: ToastrService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } }
      ]
    }).compileComponents();

    // Inject services
    httpService = TestBed.inject(HttpService);
    authService = TestBed.inject(AuthService);
    toastrService = TestBed.inject(ToastrService);

    // Create component
    fixture = TestBed.createComponent(OrderItemComponent);
    component = fixture.componentInstance;

    // Mock window.open
    spyOn(window, 'open').and.returnValue(mockPrintWindow as any);

    // Mock AuthService
    spyOn(authService, 'getUser').and.returnValue({ id: 'user1', name: 'Test User' });

    // Debug logs
    spyOn(console, 'log').and.callThrough();
    spyOn(console, 'warn').and.callThrough();
  });

  describe('ngOnInit', () => {
    it('should initialize component and fetch data for non-reservation view', fakeAsync(() => {
      // Arrange
      component.isReservationView = false;
      component.reservationId = null;
      component.selectedRadioValue = 'forTable';
      const mockMenus = [{ _id: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1' }];
      const mockTables = [{ _id: 'table1', tableNumber: 1 }];
      const mockReservations = [{ id: 'res1', status: 1 }];
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'menu/getMenuItems') return of({ data: mockMenus });
        if (url === 'table/getTables') return of({ data: mockTables });
        if (url === 'reservation/getReservations') return of(mockReservations);
        return of({});
      });

      // Act
      component.ngOnInit();
      tick();

      // Assert
      expect(authService.getUser).toHaveBeenCalled();
      expect(component.userDetails).toEqual({ id: 'user1', name: 'Test User' });
      expect(httpService.httpPost).toHaveBeenCalledWith('menu/getMenuItems', component.filter);
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', {});
      expect(httpService.httpPost).toHaveBeenCalledWith('reservation/getReservations', { status: 1 });
      expect(component.allMenus).toEqual(mockMenus);
      expect(component.allTables).toEqual(mockTables);
      expect(component.allReservations).toEqual(mockReservations);
      expect(component.isLoading).toBeFalse();
      //expect(httpService.httpGet).not.toHaveBeenCalled(); // No loadOrder for null reservationId
    }));

    it('should initialize component and load order for reservation view', fakeAsync(() => {
      // Arrange
      component.isReservationView = true;
      component.reservationId = 'res1';
      component.selectedRadioValue = 'forReservation';
      const mockMenus = [{ _id: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1' }];
      const mockTables = [{ _id: 'table1', tableNumber: 1 }];
      const mockReservations = [{ id: 'res1', status: 1 }];
      const mockReservation = { id: 'res1', billing: { orders: [{ menuId: 'menu1', name: 'Pizza', qty: 2, price: 10 }] } };
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'menu/getMenuItems') return of({ data: mockMenus });
        if (url === 'table/getTables') return of({ data: mockTables });
        if (url === 'reservation/getReservations') return of(mockReservations);
        return of({});
      });
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'reservation/getReservationById?id=res1') return of(mockReservation);
        return of({});
      });

      // Act
      component.ngOnInit();
      tick();

      // Assert
      expect(authService.getUser).toHaveBeenCalled();
      expect(httpService.httpPost).toHaveBeenCalledTimes(3);
      expect(httpService.httpGet).toHaveBeenCalledWith('reservation/getReservationById?id=res1');
      expect(component.allMenus).toEqual(mockMenus);
      expect(component.allTables).toEqual(mockTables);
      expect(component.allReservations).toEqual(mockReservations);
      expect(component.reservation).toEqual(mockReservation);
      expect(component.orders).toEqual(mockReservation.billing.orders);
      expect(component.isLoading).toBeFalse();
      expect(component.isView).toBeTrue();
      expect(component.disableScreen).toBeTrue();
    }));

    it('should handle error during fetchMenuItems', fakeAsync(() => {
      // Arrange
      component.isReservationView = false;
      component.reservationId = null;
      spyOn(httpService, 'httpPost').and.callFake((url: string) => {
        if (url === 'menu/getMenuItems') return throwError(() => new Error('Fetch failed'));
        if (url === 'table/getTables') return of({ data: [] });
        if (url === 'reservation/getReservations') return of([]);
        return of({});
      });

      // Act
      component.ngOnInit();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('menu/getMenuItems', component.filter);
      expect(toastrService.error).toHaveBeenCalledWith('Failed to retrieve data');
      expect(component.isLoading).toBeFalse();
      expect(component.allMenus).toEqual([]);
    }));
  });

  describe('menuItemSelected', () => {
    it('should add new menu item to orders', () => {
      // Arrange
      const menu = { _id: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1' };
      component.disableScreen = false;

      // Act
      component.menuItemSelected(menu);

      // Assert
      expect(component.orders).toEqual([{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 1 }]);
    });

    it('should increment quantity if menu item exists', () => {
      // Arrange
      const menu = { _id: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1' };
      component.orders = [{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 1 }];
      component.disableScreen = false;

      // Act
      component.menuItemSelected(menu);

      // Assert
      expect(component.orders).toEqual([{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 2 }]);
    });

    it('should not add menu item if disableScreen is true', () => {
      // Arrange
      const menu = { _id: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1' };
      component.disableScreen = true;

      // Act
      component.menuItemSelected(menu);

      // Assert
      expect(component.orders).toEqual([]);
    });
  });

  describe('minusMenuQty', () => {
    it('should decrease quantity if qty > 1', () => {
      // Arrange
      component.orders = [{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 2 }];
      component.disableScreen = false;

      // Act
      component.minusMenuQty({ menuId: 'menu1' });

      // Assert
      expect(component.orders).toEqual([{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 1 }]);
    });

    it('should remove item if qty = 1', () => {
      // Arrange
      component.orders = [{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 1 }];
      component.disableScreen = false;

      // Act
      component.minusMenuQty({ menuId: 'menu1' });

      // Assert
      expect(component.orders).toEqual([]);
    });
  });

  describe('plusMenuQty', () => {
    it('should increase quantity', () => {
      // Arrange
      component.orders = [{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 1 }];
      component.disableScreen = false;

      // Act
      component.plusMenuQty({ menuId: 'menu1' });

      // Assert
      expect(component.orders).toEqual([{ menuId: 'menu1', name: 'Pizza', price: 10, inventoryId: 'inv1', qty: 2 }]);
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total order amount', () => {
      // Arrange
      component.orders = [
        { menuId: 'menu1', name: 'Pizza', price: 10, qty: 2 },
        { menuId: 'menu2', name: 'Burger', price: 5, qty: 3 }
      ];

      // Act
      const total = component.calculateOrderTotal();

      // Assert
      expect(total).toBe(35); // (10 * 2) + (5 * 3)
    });
  });

  describe('submitOrder', () => {
    it('should submit order for reservation', fakeAsync(() => {
      // Arrange
      component.reservationId = 'res1';
      component.selectedRadioValue = 'forReservation';
      component.orders = [{ menuId: 'menu1', name: 'Pizza', qty: 2 }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ success: true }));
      spyOn(component, 'loadOrder');

      // Act
      component.submitOrder();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('reservation/addCustomerOrders', {
        id: 'res1',
        orders: component.orders
      });
      expect(toastrService.success).toHaveBeenCalledWith('Order taken successfully.');
      expect(component.loadOrder).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should submit order for table', fakeAsync(() => {
      // Arrange
      component.tableNumber = 1;
      component.selectedRadioValue = 'forTable';
      component.orders = [{ menuId: 'menu1', name: 'Pizza', qty: 2 }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ success: true }));
      spyOn(component, 'loadOrder');

      // Act
      component.submitOrder();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/addOrder', {
        tableNumber: 1,
        orders: component.orders
      });
      expect(toastrService.success).toHaveBeenCalledWith('Order taken successfully.');
      expect(component.loadOrder).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('isButtonDisabled', () => {
    it('should return false if tableNumber is set and selectedRadioValue is forTable', () => {
      // Arrange
      component.tableNumber = 1;
      component.selectedRadioValue = 'forTable';

      // Act
      const result = component.isButtonDisabled();

      // Assert
      expect(result).toBeFalse();
    });

    it('should return false if reservationId is set and selectedRadioValue is forReservation', () => {
      // Arrange
      component.reservationId = 'res1';
      component.selectedRadioValue = 'forReservation';

      // Act
      const result = component.isButtonDisabled();

      // Assert
      expect(result).toBeFalse();
    });

    it('should return true if neither condition is met', () => {
      // Arrange
      component.tableNumber = null;
      component.reservationId = null;
      component.selectedRadioValue = 'forTable';

      // Act
      const result = component.isButtonDisabled();

      // Assert
      expect(result).toBeTrue();
    });
  });

  describe('isSubmitButtonDisabled', () => {
    it('should return true if disableScreen is true', () => {
      // Arrange
      component.disableScreen = true;

      // Act
      const result = component.isSubmitButtonDisabled();

      // Assert
      expect(result).toBeTrue();
    });

    it('should return false if orders exist and tableNumber or reservationId is set', () => {
      // Arrange
      component.disableScreen = false;
      component.isView = false;
      component.orders = [{ menuId: 'menu1', name: 'Pizza', qty: 1 }];
      component.tableNumber = 1;
      component.selectedRadioValue = 'forTable';

      // Act
      const result = component.isSubmitButtonDisabled();

      // Assert
      expect(result).toBeFalse();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order for table', fakeAsync(() => {
      // Arrange
      component.tableNumber = 1;
      component.selectedRadioValue = 'forTable';
      const menu = { menuId: 'menu1', name: 'Pizza' };
      spyOn(httpService, 'httpPost').and.returnValue(of({ success: true }));
      spyOn(component, 'loadOrder');

      // Act
      component.cancelOrder(menu);
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('order/cancelOrderMenu', {
        tableNumber: 1,
        menuId: 'menu1'
      });
      expect(toastrService.success).toHaveBeenCalledWith('Order for Pizza cancelled.');
      expect(component.loadOrder).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should cancel order for reservation', fakeAsync(() => {
      // Arrange
      component.reservationId = 'res1';
      component.selectedRadioValue = 'forReservation';
      const menu = { menuId: 'menu1', name: 'Pizza' };
      spyOn(httpService, 'httpPost').and.returnValue(of({ success: true }));
      spyOn(component, 'loadOrder');

      // Act
      component.cancelOrder(menu);
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('reservation/cancelReservationOrderMenu', {
        reservationId: 'res1',
        menuId: 'menu1'
      });
      expect(toastrService.success).toHaveBeenCalledWith('Order for Pizza cancelled.');
      expect(component.loadOrder).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));
  });
});