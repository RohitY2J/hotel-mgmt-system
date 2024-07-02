import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [NotificationComponent, CommonModule, SidebarComponent],
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
  ngOnInit(): void {
    this.fetchRooms();
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
          (this.allRooms = res)
        },
        error: (err) =>
          this.triggerNotification({ message: err, error: true }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.showNotification = true;
  }
}
