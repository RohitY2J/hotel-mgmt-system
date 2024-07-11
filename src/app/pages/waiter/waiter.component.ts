import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IDropdownSettings, NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpService } from '../../services/http-service.service';
import { finalize } from 'rxjs';
import { HttpListResponse } from '../../models/HttpResponse';
import { ConstantsService } from '../../services/constants.service';
import { Router } from '@angular/router';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';

@Component({
  selector: 'app-waiter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgMultiSelectDropDownModule,
    NgSelectModule,
    LoaderComponent,
    NotificationComponent
  ],
  templateUrl: './waiter.component.html',
  styleUrl: './waiter.component.scss'
})
export class WaiterComponent implements OnInit {
  allMenus: any[] = [{
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }, {
    tableNumber: 5,
    name: "Test",
    price: 500,
  }
  ]

  isLoading: boolean = false;
  showNotification: boolean = false;
  notificationParams: any = {};
  orders: any[] = [];

  isOrderFormOpen: boolean = false;

  selectedItems: any[] = [];
  filter = {};
  orderForm: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder, 
    private httpService: HttpService,
    private constantService: ConstantsService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.orderForm = this.fb.group({
      orderId: new FormControl(''),
      status: new FormControl('', Validators.required)
    })

    this.fetchOrder();
  }

  fetchOrder(){
    this.isLoading = true;
    this.httpService
      .httpPost(
        'order/getOrders',
        this.filter
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          let response = res as HttpListResponse;
          this.orders = response.data;
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

  getStatusString(status: number){
    return this.constantService.getStatusString("orderStatus", status);
  }
  getOrderStatus(){
    return this.constantService.getStatusValuesAsDictionary("orderStatus");
  }

  addOrderButtonClicked(){
    this.router.navigate(['/order']);
  }

  closeModal(){
    this.isOrderFormOpen = false;
    this.orderForm.reset();
    this.orderForm.setValue({
      orderId: "",
      status: ""
    });
  }

  openStatusUpdateForm(order: any){
    this.orderForm.setValue({
      orderId: order._id,
      status: order.status
    })
    this.isOrderFormOpen = true;
  }

  onSubmit(){
    this.isLoading = true;
    this.httpService
      .httpPost(
        'order/updateStatus',
        this.orderForm.value
      )
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (res) => {
          console.log(res);
          this.triggerNotification({
            message: "Order status updated successfully",
            error: false
          })
          this.closeModal();
          this.fetchOrder();
        },
        error: (err) => this.triggerNotification({
          message: "Failed to retrieve data",
          error: true
        }),
      });
  }
}
