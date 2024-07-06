import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConstantsService } from '../../services/constants.service';
import { LoaderComponent } from '../shared/loader/loader.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    NotificationComponent, 
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    LoaderComponent
  ],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent implements OnInit {
  constructor(private httpService: HttpService, public constantService: ConstantsService) {}
  pageNo: Number = 1;
  showNotification: boolean = false;
  notificationParams: any = {};
  pageSize: Number = 10;
  allRooms: any = [];
  searchRequest: any = {};
  isRoomFormOpen: any = false;
  isLoading: boolean = false;
  isUpdate: boolean = false;
  createRoomRequest = new FormGroup({
    roomNumber: new FormControl('', Validators.required),
    pricePerDay: new FormControl('', Validators.required),
    occupancyStatus: new FormControl('', Validators.required),
    maintainanceStatus: new FormControl('', Validators.required),
  });
  
  
  ngOnInit(): void {
    this.fetchRooms();
  }

  openCreateRoomForm() {
    this.isRoomFormOpen = true;
    this.isUpdate = false;
  }

  fetchRooms() {
    this.isLoading = true;
    this.httpService
      .httpPost(
        `room/getRooms?pageSize=${this.pageSize}&pageNo=${this.pageNo}`,
        this.searchRequest
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          this.allRooms = res;
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
  }
  formSubmitted(){
    if (this.createRoomRequest.valid) {
      this.isLoading = true;
      this.httpService
        .httpPost(`room/createRoom`, this.createRoomRequest.value)
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
              message: 'Invalid form submitted',
              error: true,
            });
          },
        });
    }
    else{
      this.constantService.markFormGroupTouched(this.createRoomRequest);
    }
  }

  openUpdateForm(room: any){
    this.createRoomRequest.setValue({
      roomNumber: room.roomNumber,
      pricePerDay: room.pricePerDay,
      occupancyStatus: room.occupancyStatus,
      maintainanceStatus: room.maintainanceStatus
    });
    this.isUpdate = true;
    this.isRoomFormOpen = true;
  }
}
