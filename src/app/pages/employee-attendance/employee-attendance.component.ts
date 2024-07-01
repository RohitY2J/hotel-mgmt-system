import { Component } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoaderComponent } from '../shared/loader/loader.component';
import { HttpService } from '../../services/http-service.service';
import { HttpListResponse } from '../../models/HttpResponse';
import { ConstantsService } from '../../services/constants.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    LoaderComponent
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
  schedules: any[] = [];

  constructor(private httpService: HttpService,
    public constantService: ConstantsService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadRoles();
    this.loadEmployees();
    this.loadEmployeeSchedules();

    this.filter.date = this.getTodayDateString();

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

  loadEmployeeSchedules(){
    this.isLoading = true;
    this.httpService.httpPost("admin/getEmployeeSchedule", this.filter).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(
      (response) => {
        let scheduleResponse = response as HttpListResponse;
        this.schedules = scheduleResponse.data;
        console.log("Response received: ", this.schedules);
      },
      (error) => {
        console.log("Error encounter: ",error);
      }
    )
    
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
