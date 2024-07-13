import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { HttpListResponse } from '../../models/HttpResponse';
import { SocketService } from '../../socket.service';

interface GridItem {
  id: number;
  content: string;
  height: number;
} 

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    NotificationComponent
  ],
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.scss'
})
export class KitchenComponent implements OnInit {
  isLoading: boolean = false;
  showNotification: boolean = false;
  notificationParams: any = {};
  orders: any[] = []; 
  filter: any = {
    status: 0
  };
  
  ngOnInit(): void {
    this.fetchOrderItems();

    this.socketService.listenOrderUpdates().subscribe((order) => {
      this.fetchOrderItems();
    });
  }

  constructor(private httpService: HttpService, private socketService: SocketService){}

  fetchOrderItems(){
    this.isLoading = true;
    this.showNotification = false;
    this.httpService.httpPost("order/getOrders", this.filter)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe( 
        (response) => {
          this.orders = (response as HttpListResponse).data;
        },
        (err) => {
          this.triggerNotification({
            error: true,
            message: "Failed to retrieve orders"
          })
        }
      )
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }

  
}
