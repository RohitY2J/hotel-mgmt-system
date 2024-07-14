import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { HttpService } from '../../services/http-service.service';
import { finalize } from 'rxjs';
import { HttpListResponse } from '../../models/HttpResponse';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { ConstantsService } from '../../services/constants.service';

@Component({
  selector: 'app-order-bill',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    NotificationComponent,
    LoaderComponent
  ],
  templateUrl: './order-bill.component.html',
  styleUrl: './order-bill.component.scss'
})
export class OrderBillComponent implements OnInit {

  filter: any = {
    pagination: {
      page: 1,
      pageSize: 5,
      dataCount: 5
    }
  };
  roles: any[] = [];
  employees: any[] = [];
  isLoading: boolean = false;
  showNotification: boolean = false;
  notificationParams: any = {};
  orders: any[] = []; 


  ngOnInit(): void {
    this.fetchOrders();
  }

  constructor(private httpService: HttpService,
    private constantService: ConstantsService
  ) { }

  clearFilter() { }
  searchButtonClicked() { }
  searchInputChanged(event: Event) { }

  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.fetchOrders();
  }

  fetchOrders() {
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

  getOrderStatus(status: number){
    return this.constantService.getStatusString("orderStatus", status);
  }

}
