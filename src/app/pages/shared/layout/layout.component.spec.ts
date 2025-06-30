import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';

// Mock SidebarComponent as a standalone component
@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: ''
})
class MockSidebarComponent {}

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    // Configure testing module
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        LayoutComponent,
        MockSidebarComponent // Include MockSidebarComponent as a standalone import
      ]
    })
    // Override the SidebarComponent with the mock
    .overrideComponent(LayoutComponent, {
      set: {
        imports: [RouterTestingModule, MockSidebarComponent]
      }
    })
    .compileComponents();

    // Initialize component and fixture
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up fixture
    fixture.destroy();
  });

  it('should create', () => {
    // Verify component creation
    expect(component).toBeTruthy();
  });

  it('should render the sidebar component', () => {
    // Query the DOM for the app-sidebar element
    const sidebarElement = fixture.nativeElement.querySelector('app-sidebar');
    
    // Verify that the sidebar component is present in the template
    expect(sidebarElement).not.toBeNull();
  });

  it('should include router-outlet in the template', () => {
    // Query the DOM for the router-outlet element
    const routerOutletElement = fixture.nativeElement.querySelector('router-outlet');
    
    // Verify that the router-outlet is present in the template
    expect(routerOutletElement).not.toBeNull();
  });
});