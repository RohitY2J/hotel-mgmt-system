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
import { Router } from '@angular/router';
import { Datepicker, DatepickerOptions, InstanceOptions } from 'flowbite';

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
    date: "",
    status: "",
    tableNumber: "",
    customerName: "",
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

  isCheckOutModalVisible: boolean = false;
  discount: Number = 0;
  tax: Number = 0;
  tableNumbers: any[]= [];

  selectedOrder: any = {};

  datepicker: Datepicker | null = null;


  ngOnInit(): void {
    this.fetchOrders();
    this.filter.date = this.constantService.getDateTodayString();

    // set the target element of the input field or div
    const $datepickerEl: HTMLInputElement = document.getElementById('datepicker-filter') as HTMLInputElement;

    // optional options with default values and callback functions
    const options: DatepickerOptions = {
      defaultDatepickerId: null,
      autohide: true,
      format: 'mm/dd/yyyy',
      maxDate: this.filter.date,
      minDate: null,
      orientation: 'bottom',
      buttons: true,
      autoSelectToday: 0,
      title: null,
      rangePicker: false
    };

    // instance options object
    const instanceOptions: InstanceOptions = {
      id: 'datepicker-filter-custom',
      override: true
    };

    /*
     * $datepickerEl: required
     * options: optional
     * instanceOptions: optional
     */
    this.datepicker = new Datepicker(
      $datepickerEl,
      options,
      instanceOptions
    );


    this.datepicker?.updateOnHide(() => {
      debugger;
      this.filter.date = this.datepicker?.getDate() as string;
    })
  }

  constructor(private httpService: HttpService,
    private constantService: ConstantsService,
    private router: Router
  ) { }

  clearFilter() { 
    this.filter = {
      date: this.constantService.getDateTodayString(),
      status: "",
      tableNumber: "",
      customerName: "",
      pagination: {
        page: 1,
        pageSize: 5,
        dataCount: 5
      }
    };
    this.fetchOrders();
  }
  searchButtonClicked() { 
    this.fetchOrders();
  }
  searchInputChanged(event: Event) { }

  openCheckOutModal() {
    this.isCheckOutModalVisible = true;
  }
  closeCheckOutModal() {
    this.isCheckOutModalVisible = false;
  }

  updatePaginationPage(page: number) {
    this.filter.pagination.page = page;
    this.fetchOrders();
  }

  checkOutAndPrintInvoice() {
    this.isLoading = true;
    this.selectedOrder.discount = this.discount;
    this.selectedOrder.tax = this.tax;
    this.selectedOrder.status = 3; //billed
    this.httpService
      .httpPost(`order/updateOrder`, this.selectedOrder)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (res) =>{
          this.router.navigate(['/print-food-invoice'], {
            queryParams: { id: this.selectedOrder._id },
          });
        },
        error: (err) => {
          console.log;
          this.triggerNotification({
            message: "Failed to print food invoice",
            error: true
          })
        },
      });
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

  fetchAllTableNumber(){
    this.httpService.httpGet('order/getTableNumbers')
    .subscribe(
      (res) => {
        this.tableNumbers = (res as HttpListResponse).data;
      },  
      (err) => {
        this.triggerNotification({
          message: "Failed to get table numbers",
          error: true
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

  getOrderStatusList(){
    return this.constantService.getStatusValuesAsDictionary("orderStatus");
  }

  generateInvoiceClicked(order: any){
    this.selectedOrder = order;
    this.isCheckOutModalVisible = true;
  }

}
