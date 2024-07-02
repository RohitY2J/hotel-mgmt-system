import { Component } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  isLoading: boolean = false;
  myForm: FormGroup = new FormGroup({});
  selectedFile: File | undefined;
  filter = { 
    searchText: "",
    role: "",
    shift: "", 
    date: "" }
  allShifts: { key: number, value: string }[] = [];
  allAttendance: { key: number, value: string }[] = [];
  allShiftStatus: { key: number, value: string }[] = [];

  roles: any[] = [];
  employees: any[] = [];
  schedules: any[] = [];

  constructor(private httpService: HttpService,
    public constantService: ConstantsService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.filter.date = this.getTodayDateString();
    this.allShifts = this.constantService.getStatusValuesAsDictionary("shift");
    this.allAttendance = this.constantService.getStatusValuesAsDictionary("attendanceStatus");
    this.allShiftStatus = this.constantService.getStatusValuesAsDictionary("shiftStatus");
    
    this.loadRoles();
    this.loadEmployeeSchedules();

    this.myForm = this.fb.group({
      scheduleId: [''],
      shift: ['', Validators.required],
      attendance: ['', Validators.required],
      shiftStatus: ['', Validators.required],
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

  searchButtonClicked() {
    this.loadEmployeeSchedules();
  }

  clearFilter(){
    this.filter = { 
      searchText: "",
      role: "",
      shift: "", 
      date: this.getTodayDateString() }
    this.loadEmployeeSchedules();
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

  updateButtonClicked(schedule: any){
    const initialValues = {
      scheduleId: schedule._id,
      shift: schedule.shift,
      attendance: schedule.attendanceStatus,
      shiftStatus: schedule.shiftStatus,
    };

    this.myForm.setValue(initialValues);
    this.isOpen = true;
  }

  closeModal(){
    this.isOpen = false;
  }

  submitForm(){
    if (this.myForm.valid) {
      this.isLoading = true;
      
      this.httpService.httpPost("admin/updateEmployeeSchedule",this.myForm.value)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe(
        (response)=>{
          this.closeModal();
          this.loadEmployeeSchedules();
        },
        (error) => {
          console.log("Error caught", error);
        }
      );
    } 
  }

}
