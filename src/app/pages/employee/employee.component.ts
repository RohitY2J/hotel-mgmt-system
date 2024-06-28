import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderComponent } from '../shared/loader/loader.component';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    SidebarComponent,
    LoaderComponent
  ],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss'
})
export class EmployeeComponent {
  isOpen: boolean = false;
  isLoading: boolean = false;
  myForm: FormGroup = new FormGroup({});

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.myForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      address: [''],
      role: ['Default']
    });
  }

  submitForm() {
    console.log("submitting form");
    if (this.myForm.valid) {
      // Perform actions with form data here (e.g., submit to backend)
      this.isLoading = true;
      console.log(this.myForm.value);
    } else {
      // Optionally, mark all fields as touched to trigger validation messages
      this.markFormGroupTouched(this.myForm);
    }
  }

  // Helper function to mark all controls in a FormGroup as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  openModal() {
    console.log("Clicked");
    this.isOpen = true;
  }
  closeModal() {
    this.isOpen = false;
  }


}
