import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { finalize } from 'rxjs';
import { HttpListResponse } from '../../models/HttpResponse';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-item',
  standalone: true,
  imports: [
    CommonModule, 
    NotificationComponent,
    LoaderComponent
  ],
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss'
})
export class OrderItemComponent implements OnInit {
  
  isLoading: boolean = false;
  filter: any = {};
  allMenus: any[] = [];
  showNotification: boolean = false;
  notificationParams: any = {};

  products = [
    { name: 'Product Name 1', price: 49.99, image: 'https://via.placeholder.com/300' },
    { name: 'Product Name 2', price: 59.99, image: 'https://via.placeholder.com/300' },
    { name: 'Product Name 3', price: 69.99, image: 'https://via.placeholder.com/300' },
    { name: 'Product Name 3', price: 69.99, image: 'https://via.placeholder.com/300' },
    { name: 'Product Name 3', price: 69.99, image: 'https://via.placeholder.com/300' }
    // Add more products as needed
  ];

  orders: any[] = [
    { name: "Chowmein", price: "400"},
    { name: "Chowmein", price: "400"},
    { name: "Chowmein", price: "400"},
    { name: "Chowmeindfgdfgdfg dfdfgdfgdfg", price: "400"},
  ];


  constructor(private httpService: HttpService){}
  
  ngOnInit(): void {
    this.fetchMenuItems();
  }
  
  searchButtonClicked(){

  }

  clearFilter(){

  }

  fetchMenuItems() {
    this.isLoading = true;
    this.httpService
      .httpPost(
        'menu/getMenuItems',
        this.filter
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          let response = res as HttpListResponse; 
          this.allMenus = response.data;
        },
        error: (err) => this.triggerNotification({ 
          message: "Failed to retrieve data", 
          error: true }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }
}
