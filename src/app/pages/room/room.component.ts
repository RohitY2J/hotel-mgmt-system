import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [NotificationComponent, CommonModule, SidebarComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent implements OnInit {
  constructor(private httpService: HttpService) {}
  pageNo: Number = 1;
  showNotification: boolean = false;
  notificationParams: any = {};
  pageSize: Number = 10;
  allRooms: any = [];
  searchRequest: any = {};
  isRoomFormOpen: any = false;
  ngOnInit(): void {
    this.fetchRooms();
  }

  roomOccupancyStatus:any = [
    {"value": "Booked", "text": "Booked"},
    {"value": "CheckedIn", "text": "Checked In"},
    {"value": "Available", "text": "Available"},

  ];

  roomMaintainanceStatus:any = [
    {"value": "Clean", "text": "Clean"},
    {"value": "Dirty", "text": "Dirty"},
  ];

  createRoomRequest = new FormGroup({
    roomNumber: new FormControl('', Validators.required),
    pricePerDay: new FormControl('', Validators.required),
    occupancyStatus: new FormControl('', Validators.required),
    maintainanceStatus: new FormControl('', Validators.required),
  });

  openCreateRoomForm() {
    this.isRoomFormOpen = true;
  }

  fetchRooms() {
    this.httpService
      .httpPost(
        `room/getRooms?pageSize=${this.pageSize}&pageNo=${this.pageNo}`,
        this.searchRequest
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          this.allRooms = res;
        },
        error: (err) => this.triggerNotification({ message: err, error: true }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.showNotification = true;
  }
  closeModal() {
    this.isRoomFormOpen = false;
  }
  formSubmitted(){
    if (this.createRoomRequest.invalid) {
      this.triggerNotification({
        message: 'Invalid form submitted',
        error: true,
      });
    } else {
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
  }
}
