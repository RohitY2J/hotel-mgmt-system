import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { OrderTableComponent } from './order-table.component';
import { HttpService } from '../../services/http-service.service';
import { ConstantsService } from '../../services/constants.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { FormBuilder } from '@angular/forms';

describe('OrderTableComponent', () => {
  let component: OrderTableComponent;
  let fixture: ComponentFixture<OrderTableComponent>;
  let httpService: HttpService;
  let constantsService: ConstantsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrderTableComponent,
        NotificationComponent,
        LoaderComponent,
        PaginationComponent,
        HttpClientTestingModule,
        CommonModule,
        ReactiveFormsModule
      ],
      providers: [
        FormBuilder,
        HttpService,
        {
          provide: ConstantsService,
          useValue: {
            getStatusValuesAsDictionary: jasmine.createSpy('getStatusValuesAsDictionary').and.returnValue([
              { key: 1, value: 'Available' },
              { key: 2, value: 'Occupied' }
            ]),
            markFormGroupTouched: jasmine.createSpy('markFormGroupTouched')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderTableComponent);
    component = fixture.componentInstance;
    httpService = TestBed.inject(HttpService);
    constantsService = TestBed.inject(ConstantsService);

    // Debug logs
    spyOn(console, 'log').and.callThrough();
    spyOn(console, 'warn').and.callThrough();
  });

  describe('ngOnInit', () => {
    it('should initialize form and fetch tables', fakeAsync(() => {
      // Arrange
      const mockTables = [{ _id: 'table1', tableNumber: '1', location: 'Hall', status: '1', capacity: 4 }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ data: mockTables }));

      // Act
      component.ngOnInit(); // Trigger ngOnInit
      tick();

      // Assert
      //expect(constantsService.getStatusValuesAsDictionary).toHaveBeenCalledWith('tableAvailableStatus');
      expect(component.tableStatus).toEqual([{ key: 1, value: 'Available' }, { key: 2, value: 'Occupied' }]);
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.allTables).toEqual(mockTables);
      expect(component.filter.pagination.dataCount).toBe(1);
      expect(component.isLoading).toBeFalse();
      expect(component.tableForm.value).toEqual({
        id: '',
        tableNumber: '',
        location: '',
        status: '1',
        capacity: ''
      });
    }));

    it('should handle error during table fetch', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.returnValue(throwError(() => new Error('Fetch failed')));

      // Act
      component.ngOnInit(); // Trigger ngOnInit
      //tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Failed to retrieve data', error: true });
      expect(component.isLoading).toBeFalse();
      expect(component.allTables).toEqual([]);
    }));
  });

  describe('fetchTabels', () => {
    it('should fetch tables and update state', fakeAsync(() => {
      // Arrange
      const mockTables = [{ _id: 'table1', tableNumber: '1', location: 'Hall', status: '1', capacity: 4 }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ data: mockTables }));

      // Act
      component.fetchTabels();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.allTables).toEqual(mockTables);
      expect(component.filter.pagination.dataCount).toBe(1);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error and show notification', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.returnValue(throwError(() => new Error('Fetch failed')));

      // Act
      component.fetchTabels();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Failed to retrieve data', error: true });
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('openUpdateForm', () => {
    it('should set form values and open modal for update', fakeAsync(() => {
      // Arrange
      const table = { _id: 'table1', tableNumber: 1, location: 'Hall', status: '1', capacity: 4 };
      spyOn(httpService, 'httpPost').and.returnValue(of({ data: [] })); // Mock for ngOnInit

      // Act
      fixture.detectChanges(); // Trigger ngOnInit to initialize tableForm
      component.openUpdateForm(table);
      tick();

      // Assert
      expect(component.tableForm.value).toEqual({
        id: 'table1',
        location: 'Hall',
        status: '1',
        capacity: 4
      });
      expect(component.isUpdate).toBeTrue();
      expect(component.istableFormOpen).toBeTrue();
      expect(component.tableForm.get('tableNumber')?.disabled).toBeTrue();
    }));
  });

  describe('formSubmitted', () => {
    it('should create a new table when form is valid', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm
      component.isUpdate = false;
      component.tableForm.setValue({
        id: '',
        tableNumber: '2',
        location: 'Garden',
        status: '1',
        capacity: '6'
      });
      spyOn(httpService, 'httpPost').and.returnValue(of({}));
      spyOn(component, 'fetchTabels');
      spyOn(component, 'closeModal');

      // Act
      component.formSubmitted();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('/table/createTable', component.tableForm.value);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Table created successfully', error: false });
      expect(component.fetchTabels).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should update an existing table when form is valid', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm
      component.isUpdate = true;
      component.tableForm.setValue({
        id: 'table1',
        tableNumber: '1',
        location: 'Hall Updated',
        status: '2',
        capacity: '5'
      });
      spyOn(httpService, 'httpPost').and.returnValue(of({}));
      spyOn(component, 'fetchTabels');
      spyOn(component, 'closeModal');

      // Act
      component.formSubmitted();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('table/updateTable', component.tableForm.value);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Table Updated Successfully', error: false });
      expect(component.fetchTabels).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error during table creation', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm
      component.isUpdate = false;
      component.tableForm.setValue({
        id: '',
        tableNumber: '2',
        location: 'Garden',
        status: '1',
        capacity: '6'
      });
      spyOn(httpService, 'httpPost').and.returnValue(throwError(() => ({ error: { msg: 'Creation failed' } })));

      // Act
      component.formSubmitted();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('/table/createTable', component.tableForm.value);
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({ message: 'Creation failed', error: true });
      expect(component.isLoading).toBeFalse();
    }));

    it('should mark form as touched if invalid', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm
      component.tableForm.setValue({
        id: '',
        tableNumber: '',
        location: '',
        status: '',
        capacity: ''
      });

      // Act
      component.formSubmitted();
      tick();

      // Assert
      expect(constantsService.markFormGroupTouched).toHaveBeenCalledWith(component.tableForm);
      expect(component.showNotification).toBeFalse();
    }));
  });

  describe('openTableForm', () => {
    it('should open form for creating a new table', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm

      // Act
      component.openTableForm();
      tick();

      // Assert
      expect(component.isUpdate).toBeFalse();
      expect(component.istableFormOpen).toBeTrue();
      expect(component.tableForm.get('tableNumber')?.enabled).toBeTrue();
    }));
  });

  describe('closeModal', () => {
    it('should reset form and close modal', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm
      component.tableForm.setValue({
        id: 'table1',
        tableNumber: '1',
        location: 'Hall',
        status: '1',
        capacity: '4'
      });
      component.istableFormOpen = true;

      // Act
      component.closeModal();
      tick();

      // Assert
      expect(component.istableFormOpen).toBeFalse();
      expect(component.tableForm.value).toEqual({
        id: '',
        tableNumber: '',
        location: '',
        status: 1,
        capacity: ''
      });
    }));
  });

  describe('searchButtonClicked', () => {
    it('should call fetchTabels', fakeAsync(() => {
      // Arrange
      spyOn(component, 'fetchTabels');

      // Act
      component.searchButtonClicked();
      tick();

      // Assert
      expect(component.fetchTabels).toHaveBeenCalled();
    }));
  });

  describe('clearFilter', () => {
    it('should reset filter and fetch tables', fakeAsync(() => {
      // Arrange
      component.filter = { tableNumber: '2', status: '1', pagination: { page: 2, pageSize: 8, dataCount: 10 } };
      const mockTables = [{ _id: 'table1', tableNumber: '1', location: 'Hall', status: '1', capacity: 4 }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ data: mockTables }));

      // Act
      component.clearFilter();
      tick();

      // Assert
      expect(component.filter).toEqual({
        tableNumber: '',
        status: '',
        pagination: { page: 1, pageSize: 8, dataCount: 1 }
      });
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.allTables).toEqual(mockTables);
    }));
  });

  describe('updatePaginationPage', () => {
    it('should update pagination page and fetch tables', fakeAsync(() => {
      // Arrange
      const mockTables = [{ _id: 'table1', tableNumber: '1', location: 'Hall', status: '1', capacity: 4 }];
      spyOn(httpService, 'httpPost').and.returnValue(of({ data: mockTables }));

      // Act
      component.updatePaginationPage(2);
      tick();

      // Assert
      expect(component.filter.pagination.page).toBe(2);
      expect(httpService.httpPost).toHaveBeenCalledWith('table/getTables', component.filter);
      expect(component.allTables).toEqual(mockTables);
    }));
  });

  describe('updateTableForm', () => {
    it('should disable tableNumber field for update', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm
      component.isUpdate = true;

      // Act
      component.updateTableForm();
      tick();

      // Assert
      expect(component.tableForm.get('tableNumber')?.disabled).toBeTrue();
    }));

    it('should enable tableNumber field for create', fakeAsync(() => {
      // Arrange
      fixture.detectChanges(); // Initialize tableForm
      component.isUpdate = false;

      // Act
      component.updateTableForm();
      tick();

      // Assert
      expect(component.tableForm.get('tableNumber')?.enabled).toBeTrue();
    }));
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