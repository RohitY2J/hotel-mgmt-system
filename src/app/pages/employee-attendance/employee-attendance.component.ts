import { Component, OnInit, ViewChild } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderComponent } from '../shared/loader/loader.component';
import { HttpService } from '../../services/http-service.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpListResponse } from '../../models/HttpResponse';
import { Modal } from 'flowbite';

import { Datepicker } from 'flowbite';
import type { DatepickerOptions, DatepickerInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoaderComponent,
    HttpClientModule
  ],
  templateUrl: './employee-attendance.component.html',
  styleUrl: './employee-attendance.component.scss'
})
export class EmployeeAttendanceComponent {
  isOpen: boolean = false;
  isRoleModalOpen: boolean = false;
  isLoading: boolean = false;
  myForm: FormGroup = new FormGroup({});
  myRoleForm: FormGroup = new FormGroup({});
  selectedFile: File | undefined;
  filter = { searchText: "", date: "" }

  roles: any[] = [];
  employees: any[] = [];

  constructor(private fb: FormBuilder, private httpClient: HttpClient, private httpService: HttpService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadRoles();
    this.loadEmployees();

    this.filter.date = this.getTodayDateString();

    //datepicker.
    // get the currently selected date (undefined if not selected)
    //datepicker.getDate();

    // set the date (or dates if date range picker)
    //datepicker.setDate('05/31/2024');


  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.myForm.get('file')?.setValue(event.target.files[0]);
    }
  }

  async submitRoleForm() {
    this.isLoading = true;
    if (this.myRoleForm.valid) {
      this.httpService.httpPost("admin/createEmployeeRole", this.myRoleForm.value)
        .subscribe(
          (response) => {
            console.log(response);
            this.myRoleForm.reset();
            this.loadRoles();
          },
          (error) => {
            console.log(error.message);
            this.isLoading = false;
          }
        )
    }
    else {
      this.markFormGroupTouched(this.myRoleForm);
    }
  }


  async submitImage() {
    const formData = new FormData();
    formData.append('file', 'anything');

    this.httpService.httpPost("upload", formData)
      .subscribe(response => {
        console.log('Upload response:', response);
      },
        error => {
          console.error('Upload error:', error);
        });
  }

  async submitForm() {
    console.log("submitting form");
    debugger;

    if (this.myForm.valid) {
      this.isLoading = true;
      // Perform actions with form data here (e.g., submit to backend)
      console.log(this.myForm.value);
      let formData = new FormData();
      formData.append('file', this.selectedFile!);

      Object.keys(this.myForm.value).forEach(key => {
        if (key !== "file")
          formData.append(key, this.myForm.value[key]);
      });

      this.httpClient.post("http://localhost:8000/api/admin/createEmployee", formData)
        .subscribe(
          (response) => {
            console.log("Response received");
            this.isLoading = false;
          },
          (error) => {
            console.log("Error caught");
            this.isLoading = false;
          }
        );


      //this.isLoading = false;
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

  loadRoles() {
    this.isLoading = true;
    this.httpService.httpGet("admin/getRoles").subscribe(
      (response) => {
        let roleResponse = response as HttpListResponse;
        console.log('Fetched data:', roleResponse);
        this.roles = roleResponse.data;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
      }
    )
  }

  loadEmployees() {
    this.isLoading = true;
    this.httpService.httpPost("admin/getEmployees", this.filter).subscribe(
      (response) => {
        let employeeResponse = response as HttpListResponse;
        console.log('Fetched data:', response);
        this.employees = employeeResponse.data;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
      }
    );
  }

  dateSelected(event: any){
    debugger;
  }

  searchInputChanged(event: any) {
    this.filter.searchText = event.target.value;
  }

  searchButtonClicked() {
    this.loadEmployees();
  }

  getTodayDateString() {
    let today = new Date();

    // Get day, month, and year from the date object
    let day = today.getDate().toString().padStart(2, '0'); // Ensure two digits with leading zero if necessary
    let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed, so add 1
    let year = today.getFullYear();

    // Format the date string as "DD/MM/YYYY"
    return `${day}/${month}/${year}`;
  }

}
