import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { finalize } from 'rxjs';
import { HttpListResponse, HttpSingleResponse } from '../../models/HttpResponse';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
  selector: 'app-order-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotificationComponent,
    LoaderComponent,
    PaginationComponent
  ],
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss'
})
export class OrderItemComponent implements OnInit {

  isLoading: boolean = false;
  filter: any = {
    menuName: "",
    pagination: {
      page: 1,
      pageSize: 8,
      dataCount: 8
    } 
  };
  allMenus: any[] = [];
  showNotification: boolean = false;
  notificationParams: any = {};
  tableNumber: Number | null = null
  disableScreen: boolean = false;
  allTables: any[] = [];

  orders: any[] = [];


  constructor(private httpService: HttpService) { }

  async ngOnInit(){
    await this.fetchMenuItems();
    this.fetchTables();
  }

  searchButtonClicked() {
    this.fetchMenuItems();
  }

  clearFilter() {
    this.filter = {
      menuName: "",
      pagination: {
        page: 1,
        pageSize: 8,
        dataCount: 8
      } 
    };
    this.fetchMenuItems();
  }

  isSubmitButtonDisabled() {
    return !(this.orders.length > 0 && this.tableNumber) || this.disableScreen;
  }

  async fetchTables(){
    this.isLoading = true;
    this.httpService
      .httpPost(
        'table/getTables',
        {}
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          let response = res as HttpListResponse;
          this.allTables = response.data;
          //this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) => this.triggerNotification({
          message: "Failed to table data",
          error: true
        }),
      });
  }

  async fetchMenuItems() {
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
          this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) => this.triggerNotification({
          message: "Failed to retrieve data",
          error: true
        }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }

  menuItemSelected(menu: any) {
    if (!this.disableScreen) {
      const existingOrder = this.orders.find(order => order.menuId === menu._id);
      if (existingOrder) {
        // If it exists, increment the quantity
        existingOrder.qty += 1;
      } else {
        this.orders.push({
          menuId: menu._id,
          name: menu.name,
          price: menu.price,
          qty: 1
        })
      }
    }
  }

  minusMenuQty(selectedOrder: any) {
    if (!this.disableScreen) {
      const existingOrder = this.orders.find(order => order.menuId === selectedOrder.menuId);
      if (existingOrder.qty > 1) {
        // If it exists, increment the quantity
        existingOrder.qty -= 1;
      } else {
        this.orders = this.orders.filter(order => order.menuId !== selectedOrder.menuId);
      }
    }
  }

  plusMenuQty(selectedOrder: any) {
    if (!this.disableScreen) {
      const existingOrder = this.orders.find(order => order.menuId === selectedOrder.menuId);
      existingOrder.qty += 1;
    }
  }

  calculateOrderTotal() {
    return this.orders.reduce((total, order) => {
      return total + (order.price * order.qty);
    }, 0);
  }

  submitOrder() {
    this.isLoading = true;
    this.httpService
      .httpPost(
        'order/addOrder',
        {
          tableNumber: this.tableNumber,
          orders: this.orders
        }
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          this.clearOrder();
          this.triggerNotification({
            message: "Order taken successfully",
            error: false
          })
        },
        error: (err) => this.triggerNotification({
          message: "Failed to add order",
          error: true
        }),
      });
  }

  loadOrder() {
    if (this.tableNumber) {
      this.isLoading = true;
      this.httpService
        .httpPost(
          'order/getSpecificOrder',
          {
            tableNumber: this.tableNumber
          }
        )
        .pipe(finalize(() => {
          this.isLoading = false;
        }))
        .subscribe({
          next: (res) => {
            console.log(res);
            let response = res as HttpSingleResponse;
            if (response.data.orders) {
              this.orders = response.data.orders;
              this.disableScreen = true;
            }
            else {
              this.orders = [];
              this.disableScreen = true;
            }
          },
          error: (err) => this.triggerNotification({
            message: "Failed to add order",
            error: true
          }),
        });
    }
  }

  clearOrder() {
    this.disableScreen = false;
    this.orders = [];
    this.tableNumber = null;
  }
  
  updatePaginationPage(page: number){
    this.filter.pagination.page = page;
    this.fetchMenuItems();
  }
}
