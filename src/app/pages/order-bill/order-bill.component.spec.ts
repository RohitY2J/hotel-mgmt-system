import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
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

    // Mock HttpService.httpPost for filterOptions
    spyOn(httpService, 'httpPost').and.callFake((url: string) => {
      if (url === 'order/getCustomerName') {
        return of({ data: ['Customer1', 'Customer2'] });
      }
      return of({}); // Default empty response for other calls
    });

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
});