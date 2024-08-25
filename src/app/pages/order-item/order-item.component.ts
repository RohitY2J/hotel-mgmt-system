import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { finalize } from 'rxjs';
import { HttpListResponse, HttpSingleResponse } from '../../models/HttpResponse';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule } from '@angular/forms';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { AuthService } from '../../services/auth.service';
import { AutocompleteComponent } from '../shared/autocomplete/autocomplete.component';

@Component({
  selector: 'app-order-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotificationComponent,
    LoaderComponent,
    PaginationComponent,
    AutocompleteComponent
  ],
  templateUrl: './order-item.component.html',
  styleUrl: './order-item.component.scss',
})
export class OrderItemComponent implements OnInit {
  @Input({ required: false }) isReservationView: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Input({ required: false }) reservationId: any;
  isLoading: boolean = false;
  filter: any = {
    menuName: '',
    pagination: {
      page: 1,
      pageSize: 8,
      dataCount: 8,
    },
  };
  allMenus: any[] = [];
  showNotification: boolean = false;
  notificationParams: any = {};
  tableNumber: Number | null = null;
  disableScreen: boolean = false;
  allTables: any[] = [];
  allReservations: any = [];
  reservation: any = {};

  orders: any[] = [];
  userDetails: any = {};

  searchControl = new FormControl();
  filteredOptions: string[] = [];

  // radioValue = {
  //   forTable: false,
  //   forReservation: false
  // }
  selectedValue: string = 'forTable';

  constructor(private httpService: HttpService, private authService: AuthService) {}

  async ngOnInit() {
    this.userDetails = this.authService.getUser();
    await this.fetchMenuItems();
    this.fetchTables();
    this.fetchReservations();
    console.log(this.reservationId);
    if(this.reservationId)this.loadOrder();
  }

  searchButtonClicked() {
    this.fetchMenuItems();
  }

  async updateFilterOptions(value: string) {
    this.filteredOptions = await this.filterOptions(value);
  }

  async filterOptions(value: string): Promise<string[]> {
    const filterValue = value.toLowerCase();
    try {
      const res: any = await this.httpService.httpPost(`menu/getMenuName`, { query: filterValue }).toPromise();
      return res.data || [];
    } catch (err) {
      return [];
    }
  }

  clearFilter() {
    this.filter = {
      menuName: '',
      pagination: {
        page: 1,
        pageSize: 8,
        dataCount: 8,
      },
    };
    this.searchControl.setValue("");
    this.fetchMenuItems();
  }

  isSubmitButtonDisabled() {
    if (this.disableScreen) return true;
    return !(this.orders.length > 0 && (this.reservationId || this.tableNumber));
  }

  async fetchTables() {
    this.isLoading = true;
    this.httpService
      .httpPost('table/getTables', {})
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          let response = res as HttpListResponse;
          this.allTables = response.data;
          //this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) =>
          this.triggerNotification({
            message: 'Failed to table data',
            error: true,
          }),
      });
  }

  async fetchReservations(){
    this.isLoading = true;
    this.httpService
      .httpPost('reservation/getReservations', {})
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          this.allReservations = res;
          // let response = res as HttpListResponse;
          // this.allReservations = response;
          //this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) =>
          this.triggerNotification({
            message: 'Failed to table data',
            error: true,
          }),
      });
  }

  async fetchMenuItems() {
    this.isLoading = true;
    this.filter.menuName = this.searchControl.value;
    this.httpService
      .httpPost('menu/getMenuItems', this.filter)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          let response = res as HttpListResponse;
          this.allMenus = response.data;
          this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) =>
          this.triggerNotification({
            message: 'Failed to retrieve data',
            error: true,
          }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }

  menuItemSelected(menu: any) {
    if (!this.disableScreen) {
      const existingOrder = this.orders.find(
        (order) => order.menuId === menu._id
      );
      if (existingOrder) {
        // If it exists, increment the quantity
        existingOrder.qty += 1;
      } else {
        this.orders.push({
          menuId: menu._id,
          name: menu.name,
          price: menu.price,
          inventoryId: menu.inventoryId,
          qty: 1,
        });
      }
    }
  }

  minusMenuQty(selectedOrder: any) {
    if (!this.disableScreen) {
      const existingOrder = this.orders.find(
        (order) => order.menuId === selectedOrder.menuId
      );
      if (existingOrder.qty > 1) {
        // If it exists, increment the quantity
        existingOrder.qty -= 1;
      } else {
        this.orders = this.orders.filter(
          (order) => order.menuId !== selectedOrder.menuId
        );
      }
    }
  }

  plusMenuQty(selectedOrder: any) {
    if (!this.disableScreen) {
      const existingOrder = this.orders.find(
        (order) => order.menuId === selectedOrder.menuId
      );
      existingOrder.qty += 1;
    }
  }

  calculateOrderTotal() {
    return this.orders.reduce((total, order) => {
      return total + order.price * order.qty;
    }, 0);
  }

  submitOrder() {
    this.isLoading = true;
    let requestUrl = ``;
    let requestBody:any = {
      orders: this.orders
    };
    if(this.reservationId){
      requestBody.id = this.reservationId
      requestUrl = `reservation/addCustomerOrders`
    }
    else{
      requestBody.tableNumber = this.tableNumber;
      requestUrl = `order/addOrder`;
    }
  
    this.httpService
      .httpPost(requestUrl, requestBody)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.loadOrder();
        })
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          this.clearOrder();
          this.triggerNotification({
            message: 'Order taken successfully',
            error: false,
          });
        },
        error: (err) =>
          this.triggerNotification({
            message: 'Failed to add order',
            error: true,
          }),
      });
  }

  loadOrder() {
    if(this.reservationId){
      this.isLoading = true;
      this.httpService
      .httpGet(`reservation/getReservationById?id=${this.reservationId}`)
      .pipe(finalize(()=>{
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          this.reservation = res;
          if(this.reservation && this.reservation.billing)
            this.orders = this.reservation.billing.orders;

        },
        error: (err) => console.log,
        complete: () => (this.isLoading = false),
      });
    }
    if (this.tableNumber) {
      
      this.httpService
        .httpPost('order/getSpecificOrder', {
          tableNumber: this.tableNumber,
        })
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            console.log(res);
            let response = res as HttpSingleResponse;
            if (response.data) {
              this.orders = response.data.orders;
              this.disableScreen = true;
            } else {
              this.orders = [];
              this.disableScreen = true;
            }
          },
          error: (err) =>
            this.triggerNotification({
              message: 'Failed to add order',
              error: true,
            }),
        });
    }
  }

  clearOrder() {
    this.disableScreen = false;
    this.orders = [];
    this.tableNumber = null;
  }

  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.fetchMenuItems();
  }
}
