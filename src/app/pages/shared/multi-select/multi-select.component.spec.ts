import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultiSelectComponent } from './multi-select.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('MultiSelectComponent', () => {
  let component: MultiSelectComponent;
  let fixture: ComponentFixture<MultiSelectComponent>;

  beforeEach(async () => {
    // Configure testing module with necessary imports
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        MultiSelectComponent
      ]
    }).compileComponents();

    // Initialize component and fixture
    fixture = TestBed.createComponent(MultiSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up component state and fixture
    component.selectedOptions = [];
    component.searchTerm = '';
    component.dropdownOpen = false;
    fixture.destroy();
  });

  it('should create', () => {
    // Verify component creation
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    // Verify initial state of component properties
    expect(component.dropdownOpen).toBeFalse();
    expect(component.options).toEqual(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
    expect(component.selectedOptions).toEqual([]);
    expect(component.searchTerm).toBe('');
    expect(component.filteredOptions).toEqual(component.options);
    expect(component.customTemplate).toBeNull();
  });

  it('should toggle dropdown state', () => {
    // Test opening dropdown
    component.toggleDropdown();
    expect(component.dropdownOpen).toBeTrue();

    // Test closing dropdown
    component.toggleDropdown();
    expect(component.dropdownOpen).toBeFalse();
  });

  it('should add and remove option on toggleOption', () => {
    // Test selecting an option
    component.toggleOption('Option 1');
    expect(component.selectedOptions).toEqual(['Option 1']);

    // Test deselecting the same option
    component.toggleOption('Option 1');
    expect(component.selectedOptions).toEqual([]);
  });

  it('should remove option using removeOption', () => {
    // Set up selected options
    component.selectedOptions = ['Option 1', 'Option 2'];
    
    // Remove an option
    component.removeOption('Option 1');
    expect(component.selectedOptions).toEqual(['Option 2']);
  });

  it('should check if option is selected using isSelected', () => {
    // Set up selected options
    component.selectedOptions = ['Option 1'];
    
    // Verify isSelected returns true for selected option
    expect(component.isSelected('Option 1')).toBeTrue();
    // Verify isSelected returns false for unselected option
    expect(component.isSelected('Option 2')).toBeFalse();
  });

  it('should filter options based on search term', () => {
    // Set search term
    component.searchTerm = 'Option 1';
    
    // Trigger filtering
    component.filterOptions();
    
    // Verify filtered options
    expect(component.filteredOptions).toEqual(['Option 1']);
    
    // Test case-insensitive filtering
    component.searchTerm = 'option 2';
    component.filterOptions();
    expect(component.filteredOptions).toEqual(['Option 2']);
    
    // Test empty search term
    component.searchTerm = '';
    component.filterOptions();
    expect(component.filteredOptions).toEqual(component.options);
  });

  it('should handle empty search term', () => {
    // Set empty search term
    component.searchTerm = '';
    
    // Trigger filtering
    component.filterOptions();
    
    // Verify all options are shown
    expect(component.filteredOptions).toEqual(component.options);
  });

  it('should handle no matching options in filter', () => {
    // Set search term with no matches
    component.searchTerm = 'Nonexistent';
    
    // Trigger filtering
    component.filterOptions();
    
    // Verify filtered options are empty
    expect(component.filteredOptions).toEqual([]);
  });
});