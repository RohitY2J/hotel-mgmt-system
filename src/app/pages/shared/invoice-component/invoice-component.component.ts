import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-invoice-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-component.component.html',
  styleUrl: './invoice-component.component.scss',
})
export class InvoiceComponentComponent implements OnChanges {
  @Input({ required: true }) reservation!: any;

  ngOnChanges(): void {
    if (this.reservation != null && this.reservation != undefined) {
      console.log(this.reservation);
      this.resetValues();
      this.getOrderAmount();
      this.getReservationAmount();
    }
  }


  constructor(private router: Router) {}

  rooms: any = [];
  discount: number = 0;
  tax: number = 0;
  totalPayable: number = 0;
  subTotal: number = 0;
  invoiceDate: any = Date.now();
  roomTotal: any = 0;
  totalPaidAmount: number = 0;
  totalRemainingAmount: number = 0;
  totalRemainingAmountAbs: number = 0;

  resetValues() {
    this.rooms = [];
    this.discount = 0;
    this.tax = 0;
    this.totalPayable = 0;
    this.subTotal = 0;
    this.invoiceDate = Date.now();
    this.roomTotal = 0;
    this.totalPaidAmount = 0;
    this.totalRemainingAmount = 0;
    this.totalRemainingAmountAbs = 0;
  }

  getReservationAmount() {
    let noOfDays = Math.floor(
      (Date.parse(this.reservation.checkOutDate) -
        Date.parse(this.reservation.checkInDate)) /
        (1000 * 60 * 60 * 24)
    );
    //cannot book room for less than a day
    if (noOfDays <= 0) noOfDays = 1;

    this.reservation.rooms.forEach((room: any) => {
      let x = {
        roomNumber: room.roomNumber,
        price: room.price,
        qty: noOfDays,
        total: room.price * noOfDays,
      };
      this.rooms.push(x);
      this.roomTotal += x.total;
    });
    if (this.reservation != null) {
      let total = this.reservation.billing.orders.reduce(
        (a: any, o: any) => a + o.qty * o.price,
        0
      );
      total += this.roomTotal;
      if (this.reservation.billing.discountPercentage > 0)
        this.discount = Math.round(
          (Number(total) / 100) * this.reservation.billing.discountPercentage
        );
      this.discount += this.reservation?.billing?.flatDiscount ?? 0;
      // if (this.reservation.billing.taxPercentage > 0)
      //   this.tax = Math.round(
      //     ((total - Number(this.discount)) / 100) *
      //       this.reservation.billing.taxPercentage
      //   );
      this.totalPayable = Math.round(
        total - Number(this.discount) + Number(this.tax)
      );
    }

    this.totalPaidAmount = this.reservation.billing.totalPaidAmount;
    this.totalRemainingAmount =
      Number(this.totalPayable) - Number(this.totalPaidAmount);
    this.totalRemainingAmountAbs = Math.abs(this.totalRemainingAmount);
    console.log(this.rooms);
  }

  getOrderAmount() {
    this.subTotal = this.reservation.billing.orders.reduce(
      (a: any, o: any) => a + o.qty * o.price,
      0
    );
  }
  printInvoice() {
    this.router.navigate(['/print-invoice'], {
      queryParams: { id: this.reservation.id },
    });
  }
}
