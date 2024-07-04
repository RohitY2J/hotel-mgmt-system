import { Component, OnInit } from '@angular/core';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http-service.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [
    LoaderComponent,
    NotificationComponent,
    SidebarComponent,
    CommonModule,
  ],
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.scss',
})
export class ReservationComponent implements OnInit {
  notificationParams: any;
  isConfirmDialogOpen: any = false;
  showNotification: any = false;
  isLoading: any = false;
  reservations: any = [];
  // reservation:any={};
  constructor(private httpService: HttpService) {}
  ngOnInit(): void {
    this.getReservations();
  }
  deleteButtonClicked(reservation: any) {}
  editButtonClicked(reservation: any) {}
  searchButtonClicked() {}

  closeConfirmDialog() {}

  openModalForCreatingEmployee() {}

  confirmButtonClicked() {}
  searchInputChanged(e: any) {}

  getReservations() {
    this.isLoading = true;
    this.httpService
      .httpPost('reservation/getReservations?pageNo=1&pageSize=100', {})
      .subscribe({
        next: (res) => (this.reservations = res),
        error: (err) => console.log,
        complete: () => (this.isLoading = false),
      });
  }
}
