import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { HttpService } from '../../services/http-service.service';
import { debounceTime, finalize } from 'rxjs';
import { HttpListResponse } from '../../models/HttpResponse';
import { NotificationComponent } from '../shared/notification/notification.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { ConstantsService } from '../../services/constants.service';
import { Router } from '@angular/router';
import { Datepicker, DatepickerOptions, InstanceOptions } from 'flowbite';
import { AutocompleteComponent } from '../shared/autocomplete/autocomplete.component';


@Component({
  selector: 'app-order-bill',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    NotificationComponent,
    LoaderComponent,
    AutocompleteComponent,
    ReactiveFormsModule
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
  tableNumbers: any[] = [];

  selectedOrder: any = {};

  datepicker: Datepicker | null = null;

  steps = ['Step 1', 'Step 2'];
  currentStep = 0;

  amount: any = {
    subTotal: 0,
    discountAmt: 0,
    taxAmt: 0,
    totalPayable: 0
  };

  filteredOptions: string[] = [];
  searchControl = new FormControl();

  orderStatus: {key: Number, value: string}[];

  constructor(private httpService: HttpService,
    private constantService: ConstantsService,
    private router: Router
  ) 
  { 
    this.orderStatus = constantService.getStatusValuesAsDictionary("orderStatus");
  }
  

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

    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(async value => {
      this.filteredOptions = await this.filterOptions(value);
    });

    this.fetchTables();
  }

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
    this.searchControl.reset();
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

  checkOutAndPrintInvoice(order: any) {
    this.router.navigate(['/print-food-invoice'], {
      queryParams: { id: order._id },
    });
  }

  fetchOrders() {
    this.isLoading = true;
    this.showNotification = false;
    this.filter.customerName = this.searchControl.value;
    this.httpService.httpPost("order/getOrders", this.filter)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe(
        (response) => {
          this.orders = (response as HttpListResponse).data;
          this.filter.pagination.dataCount = this.orders.length;
        },
        (err) => {
          this.triggerNotification({
            error: true,
            message: "Failed to retrieve orders"
          })
        }
      )
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
          this.tableNumbers = response.data;
          //this.filter.pagination.dataCount = response.data.length;
        },
        error: (err) =>
          this.triggerNotification({
            message: 'Failed to table data',
            error: true,
          }),
      });
  }

  triggerNotification(notificationContent: any) {
    this.notificationParams = notificationContent;
    this.showNotification = true;
  }

  getOrderStatus(status: number) {
    return this.constantService.getStatusString("orderStatus", status);
  }

  generateInvoiceClicked(order: any) {
    this.selectedOrder = order;
  }

  payNow(order: any) {
    this.selectedOrder = order;
    this.selectedOrder.paymentType = "0";
    this.isCheckOutModalVisible = true;
  }

  checkOut() {
    this.isLoading = true;
    this.selectedOrder.status = 3; //billed
    this.httpService
      .httpPost(`order/billOrder`, this.selectedOrder)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.isCheckOutModalVisible =  false;
        })
      )
      .subscribe({
        next: (res) =>{
          
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

  async filterOptions(value: string): Promise<string[]> {
    const filterValue = value.toLowerCase();
    try {
      const res: any = await this.httpService.httpPost(`order/getCustomerName`, { filterValue }).toPromise();
      return res.data || [];
    } catch (err) {
      this.triggerNotification({
        message: 'Failed to get menu names',
        error: true
      });
      return [];
    }
  }

  async updateFilterOptions(value: string) {
    this.filteredOptions = await this.filterOptions(value);
  }

   nextStep() {
    this.selectedOrder.subTotal = this.selectedOrder.orders.reduce((accumulator: any, order: any) => accumulator + (order.price * order.qty), 0);
    if (this.selectedOrder.discountType == 0) {
      this.selectedOrder.discountAmt = (this.selectedOrder.discountPercent ?? 0) * this.selectedOrder.subTotal / 100;
    }
    else {
      this.selectedOrder.discountAmt = this.selectedOrder.discountAmt ?? 0;
    }
    if (this.selectedOrder.discountType == 0) {
      let amtAfterDiscount = this.selectedOrder.subTotal - this.selectedOrder.discountAmt;
      this.selectedOrder.taxAmt = (this.selectedOrder.taxPercent ?? 0) * amtAfterDiscount / 100
    }
    else {
      this.selectedOrder.taxAmt = this.selectedOrder.taxAmt ?? 0;
    }
    this.selectedOrder.totalPayable = this.selectedOrder.subTotal - this.selectedOrder.discountAmt + this.selectedOrder.taxAmt;

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

}
