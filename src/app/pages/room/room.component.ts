import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConstantsService } from '../../services/constants.service';
import { LoaderComponent } from '../shared/loader/loader.component';
import { finalize } from 'rxjs';
import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    NotificationComponent, 
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    LoaderComponent,
    PaginationComponent
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent implements OnInit {
  pageNo: Number = 1;
  showNotification: boolean = false;
  notificationParams: any = {};
  pageSize: Number = 10;
  allRooms: any = [];
  isRoomFormOpen: any = false;
  isLoading: boolean = false;
  isUpdate: boolean = false;
  createRoomRequest = new FormGroup({
    roomId: new FormControl(''),
    roomNumber: new FormControl('', Validators.required),
    pricePerDay: new FormControl('', Validators.required),
    occupancyStatus: new FormControl('', Validators.required),
    maintainanceStatus: new FormControl('', Validators.required),
  });
  filter: any = {
    roomNumber: "",
    occupancyStatus: "",
    maintainanceStatus: "",
    pagination: {
      page: 1,
      pageSize: 12,
      dataCount: 12,
    },
  }
  
  constructor(private httpService: HttpService, public constantService: ConstantsService) {}
  
  ngOnInit(): void {
    this.fetchRooms();
  }

  openCreateRoomForm() {
    this.isUpdate = false;
    this.updateRoomRequest();
    this.isRoomFormOpen = true;
  }

  fetchRooms() {
    this.isLoading = true;
    this.httpService
      .httpPost(
        `room/getRooms?pageSize=${this.filter.pagination.pageSize}&pageNo=${this.filter.pagination.page}`,
        this.filter
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          this.allRooms = res;
          this.filter.pagination.dataCount = this.allRooms.length;
        },
        error: (err) => this.triggerNotification({ message: err, error: true }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }
  closeModal() {
    this.isRoomFormOpen = false;
    this.createRoomRequest.reset();
    this.createRoomRequest.setValue({
      roomId: '',
      roomNumber: '',
      pricePerDay: '',
      occupancyStatus: '',
      maintainanceStatus: ''
    });
  }
  formSubmitted(){
    this.showNotification = false;
    if (this.createRoomRequest.valid) {
      if(this.isUpdate){
        this.isLoading = true;
        this.httpService
        .httpPost(`room/updateRoom`, this.createRoomRequest.value)
        .pipe(finalize(() => {
          //this.isLoading = false;
        }))
        .subscribe({
          next: (res)=>{
            this.triggerNotification({
              message: 'Room Updated Successfully',
              error: false
            });
            this.fetchRooms();
            this.closeModal();
          },
          error: (err) => {
            this.triggerNotification({
              message: 'Room update failed',
              error: true              
            });
          }
        })
      }
      else{
        this.isLoading = true;
        this.httpService
        .httpPost(`room/createRoom`, this.createRoomRequest.value)
        .pipe(finalize(() => {
          //this.isLoading = false;
        }))
        .subscribe({
          next: (res) => {
            this.triggerNotification({
              message: 'Room added successfully',
              error: false,
            });
            this.fetchRooms();
            this.closeModal();
          },
          error: (err) => {
            this.triggerNotification({
              message: err.error,
              error: true,
            });
          },
        });
      }
    }
    else{
      this.constantService.markFormGroupTouched(this.createRoomRequest);
    }
  }

  openUpdateForm(room: any){
    this.createRoomRequest.setValue({
      roomId: room.id,
      roomNumber: room.roomNumber,
      pricePerDay: room.pricePerDay,
      occupancyStatus: room.occupancyStatus,
      maintainanceStatus: room.maintainanceStatus
    });
    this.isUpdate = true;
    this.updateRoomRequest();
    this.isRoomFormOpen = true;
  }

  updateRoomRequest(){
    if(this.isUpdate){
      this.createRoomRequest.get("roomNumber")?.disable();
    }
    else{
      this.createRoomRequest.get("roomNumber")?.enable();
      this.createRoomRequest.get("occupancyStatus")?.setValue('0');
    }
    this.createRoomRequest.get("occupancyStatus")?.enable();
  }

  getRoomNumber(){
    return this.allRooms.map((room: { roomNumber: any; }) => room.roomNumber);
  }

  searchButtonClicked(){
    this.fetchRooms();
  }

  clearFilter(){
    this.filter = {
      roomNumber: "",
      occupancyStatus: "",
      maintainanceStatus: ""
    };
    this.fetchRooms();
  }

  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.fetchRooms();
  }
}
