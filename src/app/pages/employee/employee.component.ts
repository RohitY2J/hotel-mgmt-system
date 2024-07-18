import { Component, OnInit, ViewChild } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderComponent } from '../shared/loader/loader.component';
import { HttpService } from '../../services/http-service.service';
import { HttpListResponse } from '../../models/HttpResponse';
import { finalize } from 'rxjs/operators';
import { NotificationComponent } from '../shared/notification/notification.component';
import { NotificationParameter } from '../../models/Notification';
import { ModalComponent } from '../shared/modal/modal.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';

import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoaderComponent,
    NotificationComponent,
    ModalComponent,
    PaginationComponent
  ],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss'
})
export class EmployeeComponent {
  isOpen: boolean = false;
  isRoleModalOpen: boolean = false;
  isConfirmDialogOpen: boolean = false;
  isLoading: boolean = false;
  showNotification: boolean = false;
  myForm: FormGroup = new FormGroup({});
  myRoleForm: FormGroup = new FormGroup({});
  selectedFile: File | undefined;
  selectedEmployee: any = {};
  filter = { 
    searchText: "",
    role: "",
    pagination: {
      page: 1,
      pageSize: 5,
      dataCount: 5
    } 
  }
  notificationParams: NotificationParameter = {
    message: "",
    error: false
  }
  createForm: boolean = true;

  roles: any[] = [];
  employees: any[] = [];

  constructor(private fb: FormBuilder, private httpService: HttpService) { }

  async ngOnInit(){
    this.myForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      address: [''],
      role: ['', Validators.required],
      employeeId: [''],
    });

    this.myRoleForm = this.fb.group({
      roleName: ['', Validators.required]
    });

    await this.loadRoles();
    this.loadEmployees();


  
  
  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  async submitRoleForm() {
    this.isLoading = true;
    if (this.myRoleForm.valid) {
      this.httpService.httpPost("admin/createEmployeeRole", this.myRoleForm.value)
        .pipe(finalize(() => {
          this.isLoading = false;
          this.loadRoles();
          this.showNotification = true;
        }))
        .subscribe(
          (response) => {
            console.log(response);
            this.myRoleForm.reset();
            this.notificationParams.message = "Role added successfully";
            this.notificationParams.error = false;
          },
          (error) => {
            console.log(error.message);
            this.notificationParams.message = error.message;
            this.notificationParams.error = true;
            this.isLoading = false;
          }
        )
    }
    else {
      this.markFormGroupTouched(this.myRoleForm);
    }
  }


  async submitForm() {
    if (this.myForm.valid) {
      this.isLoading = true;
      // Perform actions with form data here (e.g., submit to backend)
      console.log(this.myForm.value);
      let formData = new FormData();
      if (this.selectedFile) {
        formData.append('file', this.selectedFile!);
      }

      Object.keys(this.myForm.value).forEach(key => {
        formData.append(key, this.myForm.value[key]);
      });

      if (this.createForm) {
        this.showNotification = false;
        this.httpService.httpPost("admin/createEmployee", formData)
          .pipe(finalize(() => {
            this.isLoading = false;
            this.showNotification = true;
            this.loadEmployees();
            this.selectedFile = undefined;
          }))
          .subscribe(
            (response) => {
              console.log("Response received");
              this.notificationParams.message = "Employee added successfully";
              this.notificationParams.error = false;
              this.closeModal();
            },
            (error) => {
              console.log("Error caught");
              this.notificationParams.message = error.error.msg;
              this.notificationParams.error = true;
            }
          );
      }
      else {
        this.showNotification = false;
        this.httpService.httpPost("admin/updateEmployee", formData)
          .pipe(finalize(() => {
            this.isLoading = false;
            this.loadEmployees();
            this.showNotification = true;
            this.selectedFile = undefined;
          }))
          .subscribe(
            (response) => {
              this.notificationParams.message = "Employee updated successfully";
              this.notificationParams.error = false;
              this.closeModal();
            },
            (error) => {
              this.notificationParams.message = error.error.msg;
              this.notificationParams.error = true;
              console.log("Error caught", error);
            }
          )
      }

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

  openModalForCreatingEmployee() {
    this.createForm = true;
    this.myForm.reset();
    this.openModal();
  }
  openModal() {
    this.isOpen = true;
    this.loadRoles();

  }
  closeModal() {
    this.isOpen = false;
    this.myForm.reset();
  }

  openRoleModal() {
    this.isRoleModalOpen = true;
    this.loadRoles();
  }

  closeRoleModal() {
    this.isRoleModalOpen = false;
  }

  closeConfirmDialog() {
    this.isConfirmDialogOpen = false;
  }

  async loadRoles() {
    this.isLoading = true;

    try {
      const response = await firstValueFrom(this.httpService.httpGet("admin/getRoles"));
      let roleResponse = response as HttpListResponse;
      console.log('Fetched data:', roleResponse);
      this.roles = roleResponse.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      this.isLoading = false;
    }
  
  }

  loadEmployees() {
    this.isLoading = true;
    this.httpService.httpPost("admin/getEmployees", this.filter)
    .pipe(finalize(() => {
      this.isLoading = false;
    }))
    .subscribe(
      (response) => {
        let employeeResponse = response as HttpListResponse;
        console.log('Fetched data:', response);
        this.employees = employeeResponse.data;
        this.filter.pagination.dataCount = this.employees.length;
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }

  searchInputChanged(event: any) {
    this.filter.searchText = event.target.value;
  }

  searchButtonClicked() {
    this.loadEmployees();
  }

  clearFilter(){
    this.filter = { 
      searchText: "",
      role: "",
      pagination: {
        page: 1,
        pageSize: 5,
        dataCount: 5
      } 
    }
    this.loadEmployees();
  }

  editButtonClicked(employee: any) {
    this.createForm = false;
    let initialValues = {
      employeeId: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.contactInfo.email,
      phoneNumber: employee.contactInfo.phone,
      address: employee.contactInfo.address,
      role: employee.role._id,
    }

    this.myForm.setValue(initialValues);
    this.openModal();
  }

  deleteButtonClicked(employee: any) {
    this.isConfirmDialogOpen = true;
    this.selectedEmployee = employee;
  }

  confirmButtonClicked() {
    this.isLoading = true;
    this.httpService.httpPost('admin/deleteEmployee', this.selectedEmployee)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loadEmployees();
      }))
      .subscribe(
        (response) => {
          console.log("Deleted successfully");
          this.closeConfirmDialog();
        },
        (error) => {
          console.log("Error while deleting", error);
        });
  }

  updatePaginationPage(page: number){
    this.filter.pagination.page = page;
    this.loadEmployees();
  }

}
