import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { KitchenComponent } from './kitchen.component';
import { HttpService } from '../../services/http-service.service';
import { SocketService } from '../../socket.service';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { of, throwError } from 'rxjs';

describe('KitchenComponent', () => {
  let component: KitchenComponent;
  let fixture: ComponentFixture<KitchenComponent>;
  let mockHttpService: jasmine.SpyObj<HttpService>;
  let mockSocketService: jasmine.SpyObj<SocketService>;

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj('HttpService', ['httpPost']);
    mockSocketService = jasmine.createSpyObj('SocketService', ['listenOrderUpdates']);

    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        LoaderComponent,
        NotificationComponent,
        KitchenComponent
      ],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: SocketService, useValue: mockSocketService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(KitchenComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default properties', () => {
    expect(component.isLoading).toBeFalse();
    expect(component.showNotification).toBeFalse();
    expect(component.notificationParams).toEqual({});
    expect(component.orders).toEqual([]);
    expect(component.filter).toEqual({ status: 0 });
  });

  it('should call fetchOrderItems on ngOnInit and subscribe to socket updates', () => {
    spyOn(component, 'fetchOrderItems');
    mockSocketService.listenOrderUpdates.and.returnValue(of({}));
    
    component.ngOnInit();
    
    expect(component.fetchOrderItems).toHaveBeenCalled();
    expect(mockSocketService.listenOrderUpdates).toHaveBeenCalled();
  });

  it('should call fetchOrderItems when socket emits an update', () => {
    spyOn(component, 'fetchOrderItems');
    mockSocketService.listenOrderUpdates.and.returnValue(of({}));
    
    component.ngOnInit();
    
    expect(component.fetchOrderItems).toHaveBeenCalledTimes(2); // Once on init, once on socket update
  });

  describe('fetchOrderItems', () => {
    it('should set isLoading to true, call httpPost, and update orders on success', () => {
      const mockResponse = { data: [{ id: 1, content: 'Order 1' }, { id: 2, content: 'Order 2' }] };
      mockHttpService.httpPost.and.returnValue(of(mockResponse));
      
      component.fetchOrderItems();
      
      expect(mockHttpService.httpPost).toHaveBeenCalledWith('order/getOrders', component.filter);
      expect(component.orders).toEqual(mockResponse.data);
      expect(component.isLoading).toBeFalse();
      expect(component.showNotification).toBeFalse();
    });

    it('should handle error, set isLoading to false, and trigger notification', () => {
      mockHttpService.httpPost.and.returnValue(throwError(() => new Error('Failed')));
      spyOn(component, 'triggerNotification');
      
      component.fetchOrderItems();
      
      expect(component.isLoading).toBeFalse();
      expect(component.triggerNotification).toHaveBeenCalledWith({
        error: true,
        message: 'Failed to retrieve orders'
      });
    });
  });

  describe('triggerNotification', () => {
    it('should set notificationParams and showNotification', () => {
      const notificationContent = { error: true, message: 'Test error' };
      
      component.triggerNotification(notificationContent);
      
      expect(component.notificationParams).toEqual(notificationContent);
      expect(component.showNotification).toBeTrue();
    });
  });
});