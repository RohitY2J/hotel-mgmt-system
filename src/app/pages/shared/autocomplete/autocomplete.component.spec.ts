import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'; // Import testing utilities from Angular
import { ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule for form control testing
import { AutocompleteComponent } from './autocomplete.component'; // Import the component to be tested
import { CommonModule } from '@angular/common'; // Import CommonModule for Angular directives

describe('AutocompleteComponent', () => { // Define the test suite for AutocompleteComponent
  let component: AutocompleteComponent; // Declare variable to hold the component instance
  let fixture: ComponentFixture<AutocompleteComponent>; // Declare variable to hold the component fixture
  let callbackSpy: jasmine.Spy; // Declare variable to hold the spy for the callback EventEmitter

  beforeEach(async () => { // Set up before each test case
    await TestBed.configureTestingModule({ // Configure the testing module
      imports: [ // Specify modules to import
        CommonModule, // Include CommonModule for Angular directives
        ReactiveFormsModule, // Include ReactiveFormsModule for form controls
        AutocompleteComponent // Include the standalone AutocompleteComponent
      ]
    }).compileComponents(); // Compile the testing module

    fixture = TestBed.createComponent(AutocompleteComponent); // Create a test fixture for the component
    component = fixture.componentInstance; // Get the component instance from the fixture
    callbackSpy = spyOn(component.callback, 'emit'); // Create a spy on the callback EventEmitter's emit method
    fixture.detectChanges(); // Trigger change detection to initialize the component
  });

  it('should create', () => { // Test case to verify component creation
    expect(component).toBeTruthy(); // Assert that the component instance is created
  });

  it('should initialize with default placeholder', () => { // Test case to verify default placeholder
    expect(component.placeHolder).toBe('Enter search value..'); // Assert that the placeholder has the default value
  });

  it('should emit search value with debounce', fakeAsync(() => { // Test case to verify debounced search emission
    const testValue = 'test'; // Define a test input value
    component.searchControl.setValue(testValue); // Set the search control value
    expect(callbackSpy).not.toHaveBeenCalled(); // Assert that callback hasn't been called immediately

    tick(300); // Simulate passage of 300ms for debounce
    expect(callbackSpy).toHaveBeenCalledWith(testValue); // Assert that callback was called with test value
  }));

  it('should set search control value and clear filtered options on selectOption', () => { // Test case for selectOption method
    const testOption = 'selectedOption'; // Define a test option
    component.filteredOptions = ['option1', 'option2', testOption]; // Set initial filtered options
    
    component.selectOption(testOption); // Call selectOption with test option
    
    expect(component.searchControl.value).toBe(testOption); // Assert that search control value is set
    expect(component.filteredOptions).toEqual([]); // Assert that filtered options are cleared
    expect(callbackSpy).not.toHaveBeenCalled(); // Assert that callback wasn't called (emitEvent: false)
  });

  it('should handle empty filteredOptions input', () => { // Test case for empty filteredOptions
    component.filteredOptions = []; // Set filteredOptions to empty array
    fixture.detectChanges(); // Trigger change detection
    expect(component.filteredOptions).toEqual([]); // Assert that filteredOptions remains empty
  });

  it('should update filteredOptions when input changes', () => { // Test case for filteredOptions update
    component.filteredOptions = ['option1', 'option2']; // Set new filteredOptions
    fixture.detectChanges(); // Trigger change detection
    expect(component.filteredOptions).toEqual(['option1', 'option2']); // Assert that filteredOptions updated correctly
  });
});