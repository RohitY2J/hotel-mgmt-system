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
import { ConstantsService } from '../../services/constants.service';
import { ToastrService } from 'ngx-toastr';

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
  @Input({ required: false}) selectedRadioValue: string = 'forTable';
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
  
  isView: boolean = true;

  constructor(private httpService: HttpService, 
    private authService: AuthService, 
    private constantService: ConstantsService,
    private toastrService: ToastrService) {}

  async ngOnInit() {
    this.userDetails = this.authService.getUser();
    await this.fetchMenuItems();
    this.fetchTables();
    this.fetchReservations();
    console.log(this.reservationId);
    if(this.reservationId)this.loadOrder();
  }

  isButtonDisabled(){
    //return false;
    if(this.tableNumber && this.selectedRadioValue == "forTable"){
      return false;
    }
    else if(this.reservationId && this.selectedRadioValue == "forReservation"){
      return false;
    }
    return true;
  }

  onRadioChange(event: Event): void {
    this.orders = [];
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
    return !(this.orders.length > 0 && (this.reservationId || this.tableNumber) && !this.isView);
  }

  isPrintButtonDisabled(){
    if(this.orders.length == 0) return true;
    else if (this.disableScreen) return false;
    //else if(this.orders.length == 0) return false;
    else return true;
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
          this.toastrService.error('Failed to table data')
      });
  }

  async fetchReservations(){
    this.isLoading = true;
    this.httpService
      .httpPost('reservation/getReservations', {status: 1}) //checkin
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) => {
          console.log(res);
          this.allReservations = res;
        },
        error: (err) =>
          this.toastrService.error('Failed to table data')
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
          this.toastrService.error('Failed to retrieve data')
      });
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
          //this.clearOrder();
          this.toastrService.success("Order taken successfully.");
        },
        error: (err) =>
          this.toastrService.error("Failed to take order")
      });
  }

  loadOrder() {
    this.isView = true;
    this.disableScreen = true;
    this.isLoading = true;
    if(this.reservationId && this.selectedRadioValue == "forReservation"){
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
    if (this.tableNumber && this.selectedRadioValue == "forTable") {
      
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
            } else {
              this.orders = [];
            }
          },
          error: (err) =>
            this.toastrService.error('Failed to add order')
        });
    }
  }

  placeOrder() {
    this.isView = false;
    this.disableScreen = false;
    this.orders = [];
  }

  cancelOrder(menu: any){
    this.isLoading = true;
    if(this.selectedRadioValue == 'forTable' && this.tableNumber){
      this.httpService
      .httpPost(`order/cancelOrderMenu`, {tableNumber: this.tableNumber, menuId: menu.menuId})
      .pipe(finalize(()=>{
        this.isLoading = false;
        this.loadOrder();
      }))
      .subscribe({
        next: (res) => {
          this.toastrService.success(`Order for ${menu.name} cancelled.`)
        },
        error: (err) => console.log
      });
    }
    else if(this.selectedRadioValue == 'forReservation' && this.reservationId){
      this.httpService.httpPost(`reservation/cancelReservationOrderMenu`, {reservationId: this.reservationId, menuId: menu.menuId})
      .pipe(finalize(()=>{
        this.isLoading = false;
        this.loadOrder();
      }))
      .subscribe({
        next: (res) => {
          this.toastrService.success(`Order for ${menu.name} cancelled.`)
        },
        error: (err) => this.toastrService.error("Failed to cancel order menu")
      });
    }
    
  }

  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.fetchMenuItems();
  }

  items: string[] = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
  printOrder() {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      // Generate the print content dynamically
      const printContent = `
        <html>
          <head>
            <title>Order Details</title> <!-- Adding a title -->
            <style>
              @page {
                margin: 0; /* Attempt to hide headers and footers */
              }
              body {
                margin: 1cm; /* Adjust margins as needed */
                font-family: Arial, sans-serif;
              }
              ul {
                list-style-type: none;
                padding: 0;
              }
              li {
                background: #f0f0f0;
                margin: 5px 0;
                padding: 10px;
                border-radius: 4px;
              }
              h2 {
                font-size: 18px;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <h2>Order for 
              ${
                this.reservationId && this.selectedRadioValue == "forReservation" 
                ? `Rooms [${this.reservation.rooms.map((room: { roomNumber: any; }) => room.roomNumber).toString()}]` 
                : `Table ${this.allTables.find(x => x._id == this.tableNumber).tableNumber}`
              }
            </h2>
            <ul>
              ${this.orders.map(order => `<li>${order.name} - ${order.qty}</li>`).join('')}
            </ul>
          </body>
        </html>
      `;
  
      // Write the content to the new window
      printWindow.document.write(printContent);
      printWindow.document.close();
  
      // Wait for the content to be fully loaded before printing
      printWindow.onload = () => {
        printWindow.print();
      };
  
      // Close the print window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }
  }
  
}
