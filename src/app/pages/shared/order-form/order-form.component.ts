import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpService } from '../../../services/http-service.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss'
})
export class OrderFormComponent implements OnChanges, OnInit {
  constructor(private httpService: HttpService){

  }
  ngOnInit(): void {
    this.orders = [];
    this.ordersForm.reset();
  }
  ngOnChanges(){
    this.orders = this.reservation?.billing?.orders;
    if(this.orders == null || this.orders == undefined) this.orders = [];
    this.ordersForm.reset();
  }

  @Input({ required: true }) reservation!: any;
  @Input({required: true}) isVisible!: boolean;
  @Output() showNotification = new EventEmitter<any>();
  @Output() closeForm = new EventEmitter();

  orders:any = [];

  ordersForm = new FormGroup({
    summary: new FormControl('', Validators.required),
    amount: new FormControl('', Validators.required),
  });

   
  submitOrder(){

    console.log(this.reservation.billing.orders);
    if (this.ordersForm.invalid) {
      console.log("invalid");
      this.showNotification.emit({
        message: 'Invalid form. Please fill all the required fields.',
        error: true,
      });
      return;
    }
   
    this.httpService
      .httpPost('reservation/addCustomerOrders', {
        id: this.reservation.id,
        orders: this.ordersForm.value,
      })
      .subscribe({
        next: (res) => {
          this.showNotification.emit({
            message: 'Order placed.',
            error: false,
          });
          this.orders.push(this.ordersForm.value)
        },
      });
  }
  close(){
    this.closeForm.emit();
  }
}
