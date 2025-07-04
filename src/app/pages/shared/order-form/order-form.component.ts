import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpService } from '../../../services/http-service.service';
import { InvoiceComponentComponent } from '../invoice-component/invoice-component.component';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ConstantsService } from '../../../services/constants.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InvoiceComponentComponent,
    RouterModule,
  ],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent implements OnChanges, OnInit {
  constructor(
    private httpService: HttpService,
    private router: Router,
    private constantService: ConstantsService
  ) {}

  ngOnInit(): void {
    this.orders = [];
    this.ordersForm.reset({ summary: '', amount: '' }); // Explicitly reset with empty string values
  }

  ngOnChanges() {
    this.orders = this.reservation?.billing?.orders ?? []; // Use nullish coalescing to handle undefined
    this.ordersForm.reset({ summary: '', amount: '' }); // Reset with empty string values
  }

  isCheckOutModalVisible: boolean = false;
  discount: Number = 0;
  tax: Number = 0;

  @Input({ required: true }) reservation!: any;
  @Input({ required: true }) isVisible!: boolean;
  @Output() showNotification = new EventEmitter<any>();
  @Output() closeForm = new EventEmitter();
  @Output() updateReservation = new EventEmitter();

  orders: any = [];

  ordersForm = new FormGroup({
    summary: new FormControl('', Validators.required),
    amount: new FormControl('', Validators.required),
  });

  submitOrder() {
    // Avoid accessing reservation.billing.orders if undefined
    if (this.ordersForm.invalid) {
      this.showNotification.emit({
        message: 'Invalid form. Please fill all the required fields.',
        error: true,
      });
      return;
    }

    this.httpService
      .httpPost('reservation/addCustomerOrders', {
        id: this.reservation?.id,
        orders: this.ordersForm.value,
      })
      .pipe(
        finalize(() => {
          this.updateReservation.emit();
        })
      )
      .subscribe({
        next: (res) => {
          this.showNotification.emit({
            message: 'Order placed.',
            error: false,
          });
          this.updateReservation.emit();
        },
      });
  }

  updateSelection() {
    this.httpService
      .httpGet(`reservation/getReservationById?id=${this.reservation?.id}`)
      .subscribe({
        next: (res) => (this.reservation = res),
      });
  }

  close() {
    this.closeForm.emit();
  }

  getOrderAmount() {
    return this.reservation?.billing?.orders?.reduce(
      (a: any, o: any) => a + o.amount,
      0
    ) ?? 0; // Return 0 if orders is undefined
  }

  openCheckOutModal() {
    this.isCheckOutModalVisible = true;
  }

  closeCheckOutModal() {
    this.isCheckOutModalVisible = false;
  }

  checkOutAndPrintInvoice() {
    if (!this.reservation || !this.reservation.billing) {
      this.showNotification.emit({
        message: 'Reservation data is missing.',
        error: true,
      });
      return;
    }

    this.reservation.billing.discountPercentage = this.discount;
    this.reservation.billing.taxPercentage = this.tax;
    this.reservation.status = 2; // closed
    this.httpService
      .httpPost(`reservation/updateReservation`, this.reservation)
      .pipe(
        finalize(() => {
          this.router.navigate(['/print-invoice'], {
            queryParams: { id: this.reservation.id },
          });
        })
      )
      .subscribe({
        error: (err) => {
          console.log('Checkout error:', err); // Explicitly log the error
        },
      });
  }
}