import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { EmployeeComponent } from './employee.component';
import { HttpService } from '../../services/http-service.service';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { ModalComponent } from '../shared/modal/modal.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { AutocompleteComponent } from '../shared/autocomplete/autocomplete.component';

describe('EmployeeComponent', () => {
  let component: EmployeeComponent;
  let fixture: ComponentFixture<EmployeeComponent>;
  let httpService: HttpService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EmployeeComponent,
        SidebarComponent,
        LoaderComponent,
        NotificationComponent,
        ModalComponent,
        PaginationComponent,
        AutocompleteComponent,
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [
        HttpService,
        FormBuilder
      ]
    }).compileComponents();

    // Inject services
    httpService = TestBed.inject(HttpService);

    // Create component
    fixture = TestBed.createComponent(EmployeeComponent);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should initialize forms and load roles and employees', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/getEmployees') {
          expect(body).toEqual(component.filter);
          return of({ data: mockEmployees });
        }
        return of({});
      });
      spyOn(component, 'loadRoles').and.callThrough();
      spyOn(component, 'loadEmployees').and.callThrough();

      // Act
      component.ngOnInit();
      tick();

      // Assert
      expect(component.myForm).toBeDefined();
      expect(component.myForm.controls['firstName']).toBeDefined();
      expect(component.myForm.controls['firstName'].value).toBe('');
      expect(component.myForm.controls['firstName'].hasValidator(Validators.required)).toBeTrue();
      expect(component.myForm.controls['lastName']).toBeDefined();
      expect(component.myForm.controls['lastName'].value).toBe('');
      expect(component.myForm.controls['lastName'].hasValidator(Validators.required)).toBeTrue();
      expect(component.myForm.controls['email']).toBeDefined();
      expect(component.myForm.controls['email'].value).toBe('');
      expect(component.myForm.controls['email'].hasValidator(Validators.required)).toBeTrue();
      expect(component.myForm.controls['email'].hasValidator(Validators.email)).toBeTrue();
      expect(component.myForm.controls['phoneNumber']).toBeDefined();
      expect(component.myForm.controls['phoneNumber'].value).toBe('');
      expect(component.myForm.controls['phoneNumber'].hasValidator(Validators.required)).toBeTrue();
      expect(component.myForm.controls['address']).toBeDefined();
      expect(component.myForm.controls['address'].value).toBe('');
      expect(component.myForm.controls['address'].hasValidator(Validators.required)).toBeFalse();
      expect(component.myForm.controls['role']).toBeDefined();
      expect(component.myForm.controls['role'].value).toBe('');
      expect(component.myForm.controls['role'].hasValidator(Validators.required)).toBeTrue();
      expect(component.myForm.controls['employeeId']).toBeDefined();
      expect(component.myForm.controls['employeeId'].value).toBe('');
      expect(component.myForm.controls['employeeId'].hasValidator(Validators.required)).toBeFalse();

      expect(component.myRoleForm).toBeDefined();
      expect(component.myRoleForm.controls['roleName']).toBeDefined();
      expect(component.myRoleForm.controls['roleName'].value).toBe('');
      expect(component.myRoleForm.controls['roleName'].hasValidator(Validators.required)).toBeTrue();

      expect(component.loadRoles).toHaveBeenCalled();
      expect(component.loadEmployees).toHaveBeenCalled();
      expect(httpService.httpGet).toHaveBeenCalledWith('admin/getRoles');
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/getEmployees', component.filter);
      expect(component.roles).toEqual(mockRoles);
      expect(component.employees).toEqual(mockEmployees);
      expect(component.filter.pagination.dataCount).toEqual(mockEmployees.length);
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('submitForm', () => {
    beforeEach(fakeAsync(() => {
      // Initialize myForm
      component.ngOnInit();
      tick(); // Complete async operations in ngOnInit
    }));

    it('should mark controls as touched and do nothing if form is invalid', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      component.myForm.setValue({
        firstName: '', // Invalid (required)
        lastName: '',
        email: 'invalid', // Invalid (email)
        phoneNumber: '',
        address: '',
        role: '',
        employeeId: ''
      });

      // Act
      component.submitForm();
      tick(); // Handle any async validation

      // Assert
      expect(component.myForm.controls['firstName'].touched).toBeTrue();
      expect(component.myForm.controls['lastName'].touched).toBeTrue();
      expect(component.myForm.controls['email'].touched).toBeTrue();
      expect(component.myForm.controls['phoneNumber'].touched).toBeTrue();
      expect(component.myForm.controls['address'].touched).toBeTrue();
      expect(component.myForm.controls['role'].touched).toBeTrue();
      expect(component.myForm.controls['employeeId'].touched).toBeTrue();
      expect(httpService.httpPost).not.toHaveBeenCalledWith('admin/createEmployee', jasmine.anything());
      expect(httpService.httpPost).not.toHaveBeenCalledWith('admin/updateEmployee', jasmine.anything());
    }));

    it('should submit create employee request with file and handle success', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/createEmployee') {
          expect(body).toEqual(jasmine.any(FormData));
          return of({ success: true, message: 'Employee added successfully' });
        }
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      spyOn(component, 'loadEmployees').and.callThrough();
      spyOn(component, 'closeModal').and.callThrough();
      spyOn(console, 'log'); // Suppress console logs
      const formValues = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
        address: '123 Main St',
        role: '1',
        employeeId: ''
      };
      component.myForm.setValue(formValues);
      component.createForm = true;
      component.selectedFile = new File([''], 'profile.jpg');

      // Act
      component.submitForm();
      tick(); // Complete HTTP Observable and finalize

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/createEmployee', jasmine.any(FormData));
      expect(component.isLoading).toBeFalse();
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({
        message: 'Employee added successfully',
        error: false
      });
      expect(component.selectedFile).toBeUndefined();
      expect(component.loadEmployees).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.myForm.pristine).toBeTrue(); // Form reset
    }));

    it('should submit create employee request without file and handle success', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/createEmployee') {
          expect(body).toEqual(jasmine.any(FormData));
          return of({ success: true, message: 'Employee added successfully' });
        }
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      spyOn(component, 'loadEmployees').and.callThrough();
      spyOn(component, 'closeModal').and.callThrough();
      spyOn(console, 'log');
      const formValues = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
        address: '123 Main St',
        role: '1',
        employeeId: ''
      };
      component.myForm.setValue(formValues);
      component.createForm = true;
      component.selectedFile = undefined;

      // Act
      component.submitForm();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/createEmployee', jasmine.any(FormData));
      expect(component.isLoading).toBeFalse();
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({
        message: 'Employee added successfully',
        error: false
      });
      expect(component.selectedFile).toBeUndefined();
      expect(component.loadEmployees).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.myForm.pristine).toBeTrue();
    }));

    it('should submit update employee request and handle success', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/updateEmployee') {
          expect(body).toEqual(jasmine.any(FormData));
          return of({ success: true, message: 'Employee updated successfully' });
        }
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      spyOn(component, 'loadEmployees').and.callThrough();
      spyOn(component, 'closeModal').and.callThrough();
      spyOn(console, 'log');
      const formValues = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '0987654321',
        address: '456 Oak St',
        role: '2',
        employeeId: '101'
      };
      component.myForm.setValue(formValues);
      component.createForm = false;
      component.selectedFile = new File([''], 'profile.jpg');

      // Act
      component.submitForm();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/updateEmployee', jasmine.any(FormData));
      expect(component.isLoading).toBeFalse();
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({
        message: 'Employee updated successfully',
        error: false
      });
      expect(component.selectedFile).toBeUndefined();
      expect(component.loadEmployees).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
      expect(component.myForm.pristine).toBeTrue();
    }));

    it('should handle error during create employee request', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/createEmployee') {
          expect(body).toEqual(jasmine.any(FormData));
          return throwError(() => ({ success: false, error: { msg: 'Failed to create employee' } }));
        }
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      spyOn(component, 'loadEmployees').and.callThrough();
      spyOn(component, 'closeModal').and.callThrough();
      spyOn(console, 'log');
      const formValues = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
        address: '123 Main St',
        role: '1',
        employeeId: ''
      };
      component.myForm.setValue(formValues);
      component.createForm = true;
      component.selectedFile = undefined;

      // Act
      component.submitForm();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/createEmployee', jasmine.any(FormData));
      expect(component.isLoading).toBeFalse();
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({
        message: 'Failed to create employee',
        error: true
      });
      expect(component.selectedFile).toBeUndefined();
      expect(component.loadEmployees).toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
      //expect(component.myForm.pristine).toBeFalse(); // Form not reset
    }));
  });

  describe('submitRoleForm', () => {
    beforeEach(fakeAsync(() => {
      // Initialize myRoleForm
      component.ngOnInit();
      tick();
    }));

    it('should mark controls as touched and do nothing if form is invalid', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      component.myRoleForm.setValue({ roleName: '' }); // Invalid (required)

      // Act
      component.submitRoleForm();
      tick();

      // Assert
      expect(component.myRoleForm.controls['roleName'].touched).toBeTrue();
      expect(httpService.httpPost).not.toHaveBeenCalledWith('admin/createRole', jasmine.anything());
    }));

    it('should submit create role request and handle success', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/createRole') {
          expect(body).toEqual({ roleName: 'Admin' });
          return of({ success: true, message: 'Role added successfully' });
        }
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      spyOn(component, 'loadRoles').and.callThrough();
      spyOn(component, 'closeModal').and.callThrough();
      spyOn(console, 'log');
      component.myRoleForm.setValue({ roleName: 'Admin' });

      // Act
      component.submitRoleForm();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/createEmployeeRole', { roleName: 'Admin' });
      expect(component.isLoading).toBeFalse();
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({
        message: 'Role added successfully',
        error: false
      });
      expect(component.loadRoles).toHaveBeenCalled();
      expect(component.myRoleForm.pristine).toBeTrue(); // Form reset
    }));

    it('should handle error during create role request', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/createEmployeeRole') {
          expect(body).toEqual({ roleName: 'Admin' });
          return throwError(() => ({ success: false, message: 'Failed to create role' }));
        }
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      spyOn(component, 'loadRoles').and.callThrough();
      spyOn(component, 'closeModal').and.callThrough();
      spyOn(console, 'log');
      component.myRoleForm.setValue({ roleName: 'Admin' });

      // Act
      component.submitRoleForm();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/createEmployeeRole', { roleName: 'Admin' });
      expect(component.isLoading).toBeFalse();
      expect(component.showNotification).toBeTrue();
      expect(component.notificationParams).toEqual({
        message: 'Failed to create role',
        error: true
      });
      expect(component.loadRoles).toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
      //expect(component.myRoleForm.pristine).toBeFalse(); // role form not touched
    }));
  });

  describe('loadEmployees', () => {
    it('should load employees and update state on success', fakeAsync(() => {
      // Arrange
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/getEmployees') {
          expect(body).toEqual(component.filter);
          return of({ data: mockEmployees });
        }
        return of({});
      });
      component.isLoading = true;

      // Act
      component.loadEmployees();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/getEmployees', component.filter);
      expect(component.employees).toEqual(mockEmployees);
      expect(component.filter.pagination.dataCount).toEqual(mockEmployees.length);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error during load employees', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/getEmployees') {
          expect(body).toEqual(component.filter);
          return throwError(() => ({ success: false, error: {msg: 'Failed to load employees' }}));
        }
        return of({});
      });
      spyOn(console, 'log');
      component.isLoading = true;

      // Act
      component.loadEmployees();
      tick();

      // Assert
      expect(httpService.httpPost).toHaveBeenCalledWith('admin/getEmployees', component.filter);
      expect(component.employees).toEqual([]);
      expect(component.employees.length).toEqual(0);
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('loadRoles', () => {
    it('should load roles and update state on success', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      component.isLoading = true;

      // Act
      component.loadRoles();
      tick();

      // Assert
      expect(httpService.httpGet).toHaveBeenCalledWith('admin/getRoles');
      expect(component.roles).toEqual(mockRoles);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error during load roles', fakeAsync(() => {
      // Arrange
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return throwError(() => ({ success: false, message: 'Failed to load roles' }));
        }
        return of({});
      });
      spyOn(console, 'log');
      component.isLoading = true;

      // Act
      component.loadRoles();
      tick();

      // Assert
      expect(httpService.httpGet).toHaveBeenCalledWith('admin/getRoles');
      expect(component.roles).toEqual([]);
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('closeModal', () => {
    beforeEach(fakeAsync(() => {
      // Initialize forms
      component.ngOnInit();
      tick();
    }));

    it('should reset forms and close modal', fakeAsync(() => {
      // Arrange
      const mockRoles = [
        { _id: '1', roleName: 'Manager' },
        { _id: '2', roleName: 'Staff' }
      ];
      const mockEmployees = [
        { _id: '101', firstName: 'John', lastName: 'Doe', role: { _id: '1' } },
        { _id: '102', firstName: 'Jane', lastName: 'Smith', role: { _id: '2' } }
      ];
      spyOn(httpService, 'httpGet').and.callFake((url: string) => {
        if (url === 'admin/getRoles') {
          return of({ data: mockRoles });
        }
        return of({});
      });
      spyOn(httpService, 'httpPost').and.callFake((url: string, body: any) => {
        if (url === 'admin/getEmployees') {
          return of({ data: mockEmployees });
        }
        return of({});
      });
      component.myForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
        address: '123 Main St',
        role: '1',
        employeeId: ''
      });
      component.myRoleForm.setValue({ roleName: 'Admin' });
      component.selectedFile = new File([''], 'profile.jpg');

      // Act
      component.closeModal();
      tick();

      // Assert
      expect(component.myForm.pristine).toBeTrue();
      //after reset form value set to null
      expect(component.myForm.controls['firstName'].value).toBe(null);
      expect(component.myRoleForm.pristine).toBeTrue();
      expect(component.myRoleForm.controls['roleName'].value).toBe(null);
      expect(component.selectedFile).toBeUndefined();
      
    }));
  });
});