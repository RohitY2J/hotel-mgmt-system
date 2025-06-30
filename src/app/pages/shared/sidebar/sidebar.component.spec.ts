import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../services/auth.service';

// Mock initFlowbite function using Jasmine
const mockInitFlowbite = jasmine.createSpy('initFlowbite');

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  // Mock user data
  const mockUser = {
    client: {
      clientName: 'Test Client'
    }
  };

  beforeEach(async () => {
    // Create a spy for AuthService
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'logout']);
    authServiceSpy.getUser.and.returnValue(mockUser);

    // Mock the flowbite module
    spyOn(window as any, 'initFlowbite').and.callFake(mockInitFlowbite);

    // Configure testing module
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule,
        SidebarComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    // Initialize component and fixture
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up component state and fixture
    component.collapseShow = 'hidden';
    fixture.destroy();
  });

  it('should create', () => {
    // Verify component creation
    expect(component).toBeTruthy();
  });

  it('should initialize with default collapseShow value', () => {
    // Verify initial collapseShow state
    expect(component.collapseShow).toBe('hidden');
  });

  it('should set clientName from authService on ngOnInit', () => {
    // Verify clientName is set from mock user data
    expect(component.clientName).toBe('Test Client');
    expect(authService.getUser).toHaveBeenCalled();
  });

  it('should call authService.logout on logout', () => {
    // Call logout method
    component.logout();
    
    // Verify logout was called
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should toggle collapseShow with provided classes', () => {
    // Test toggling with a new class
    component.toggleCollapseShow('visible');
    expect(component.collapseShow).toBe('visible');
    
    // Test toggling with another class
    component.toggleCollapseShow('hidden');
    expect(component.collapseShow).toBe('hidden');
  });
});