import { Component, OnInit, ViewChild  } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderComponent } from '../shared/loader/loader.component';
import { HttpService } from '../../services/http-service.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpListResponse } from '../../models/HttpResponse';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    SidebarComponent,
    LoaderComponent,
    HttpClientModule
  ],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss'
})
export class EmployeeComponent {
  isOpen: boolean = false;
  isRoleModalOpen: boolean = false;
  isLoading: boolean = false;
  myForm: FormGroup = new FormGroup({});
  myRoleForm: FormGroup = new FormGroup({});
  selectedFile: File | undefined;
  filter = { searchText: "" }
  
  roles: any[] = [];
  employees: any[] = [];

  constructor(private fb: FormBuilder, private httpClient: HttpClient, private httpService: HttpService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadRoles();
    this.loadEmployees();


    this.myForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      address: [''],
      role: ['', Validators.required]
    });

    this.myRoleForm = this.fb.group({
      roleName: ['', Validators.required]
    });
  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.myForm.get('file')?.setValue(event.target.files[0]);
    }
  }

  async submitRoleForm(){
    this.isLoading = true;
    if(this.myRoleForm.valid){
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
    else{
      this.markFormGroupTouched(this.myRoleForm);
    }
  }

  
  async submitImage(){
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
    if (this.myForm.valid) {
      this.isLoading = true;
      // Perform actions with form data here (e.g., submit to backend)
      console.log(this.myForm.value);
      let formData = new FormData();
      formData.append('file', this.selectedFile!);

      Object.keys(this.myForm.value).forEach(key => {
        if(key !== "file")
          formData.append(key, this.myForm.value[key]);
      });

      this.httpService.httpPost("admin/createEmployee",formData)
      .subscribe(
        (response)=>{
          console.log("Response received");
          this.isLoading = false;
          this.closeModal();
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

  openModal() {
    console.log("Clicked");
    this.isOpen = true;
    this.loadRoles();

  }
  closeModal() {
    this.isOpen = false;
    this.myForm.reset();
  }

  openRoleModal(){
    this.isRoleModalOpen = true;
    this.loadRoles();
  }

  closeRoleModal(){
    this.isRoleModalOpen = false;
  }

  loadRoles(){
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

  loadEmployees(){
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

  searchInputChanged(event: any){
    this.filter.searchText = event.target.value;
  }

  searchButtonClicked(){
    this.loadEmployees();
  }

}
