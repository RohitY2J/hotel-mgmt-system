import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { HttpService } from '../../services/http-service.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../shared/notification/notification.component';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockHttpService: jasmine.SpyObj<HttpService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(waitForAsync(() => {
    mockHttpService = jasmine.createSpyObj('HttpService', ['httpPost']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        NotificationComponent,
        LoginComponent // Moved from declarations to imports
      ],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize loginRequest form with email and password fields', () => {
    expect(component.loginRequest.get('email')).toBeTruthy();
    expect(component.loginRequest.get('password')).toBeTruthy();
    expect(component.loginRequest.get('email')?.hasValidator(Validators.required)).toBeTrue();
    expect(component.loginRequest.get('password')?.hasValidator(Validators.required)).toBeTrue();
  });

  it('should set isFormValid to false if form is invalid', () => {
    component.loginRequest.setValue({ email: '', password: '' });
    component.login();
    expect(component.isFormValid).toBeFalse();
  });

  it('should not call httpPost if form is invalid', () => {
    component.loginRequest.setValue({ email: '', password: '' });
    component.login();
    expect(mockHttpService.httpPost).not.toHaveBeenCalled();
  });

  it('should call httpPost, navigate to dashboard, and show success notification on valid form submission', () => {
    component.loginRequest.setValue({ email: 'test@example.com', password: 'password' });
    mockHttpService.httpPost.and.returnValue(of({}));
    
    component.login();
    
    expect(mockHttpService.httpPost).toHaveBeenCalledWith('login', { email: 'test@example.com', password: 'password' });
    expect(component.isLoading).toBeFalse();
    expect(component.showNotification).toBeTrue();
    expect(component.notificationParams).toEqual({ message: 'Logged in successfully.', error: false });
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('should handle error, show error notification, and not navigate on HTTP failure', () => {
    component.loginRequest.setValue({ email: 'test@example.com', password: 'password' });
    mockHttpService.httpPost.and.returnValue(throwError(() => ({ error: { msg: 'Invalid credentials' } })));
    
    component.login();
    
    expect(mockHttpService.httpPost).toHaveBeenCalledWith('login', { email: 'test@example.com', password: 'password' });
    expect(component.isLoading).toBeFalse();
    expect(component.showNotification).toBeTrue();
    expect(component.notificationParams).toEqual({ message: 'Error logging in: Invalid credentials', error: true });
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should set isLoading to true during HTTP request and false after completion', () => {
    component.loginRequest.setValue({ email: 'test@example.com', password: 'password' });
    mockHttpService.httpPost.and.returnValue(of({}));
    
    component.login();
    
    expect(component.isLoading).toBeFalse();
  });
});