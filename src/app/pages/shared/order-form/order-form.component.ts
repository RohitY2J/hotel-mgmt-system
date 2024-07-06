import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpService } from '../../../services/http-service.service';
import { InvoiceComponentComponent } from '../invoice-component/invoice-component.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InvoiceComponentComponent, RouterModule],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss'
})
export class OrderFormComponent implements OnChanges, OnInit {
  constructor(private httpService: HttpService, private router: Router){

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
  @Output() updateReservation = new EventEmitter();

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
          this.updateReservation.emit();

        },
       
      });
      this.updateSelection();
  }
  updateSelection(){
    this.httpService.httpGet(`reservation/getReservationById?id=${this.reservation.id}`).subscribe({
      next:(res)=>this.reservation = res
    })
  }
  close(){
    this.closeForm.emit();
  }
  getOrderAmount(){
    return this.reservation.billing.orders.reduce(
      (a:any,o:any)=> a + o.amount, 0
  );
}
}
