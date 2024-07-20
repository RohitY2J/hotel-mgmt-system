import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InvoiceComponentComponent } from '../shared/invoice-component/invoice-component.component';
import { HttpService } from '../../services/http-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-print-layout',
  standalone: true,
  imports: [InvoiceComponentComponent, CommonModule],
  templateUrl: './print-layout.component.html',
  styleUrl: './print-layout.component.scss',
})
export class PrintLayoutComponent implements OnInit {
  id: string = '';

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService
  ) {}
  reservationId: any;
  reservation: any;
  discount: Number = 0;
  tax: Number = 0;
  totalPayable: Number = 0;
  subTotal: Number = 0;
  invoiceDate: any = Date.now();
  rooms: any = [];
  roomTotal: any = 0;
  async ngOnInit() {
    this.reservationId = this.route.snapshot.queryParamMap.get('id');
    console.log(this.reservationId);
    await this.getReservation();
    setTimeout(() => {
      window.print();
    }, 1000);
  }

  async getReservation() {
    this.httpService
      .httpGet(`reservation/getReservationById?id=${this.reservationId}`)
      .subscribe({
        next: (res) => {
          this.reservation = res;
          this.getOrderAmount();
          let noOfDays = Math.floor(
            (Date.parse(this.reservation.checkOutDate) -
              Date.parse(this.reservation.checkInDate)) /
              (1000 * 60 * 60 * 24)
          );
          //cannot book room for less than a day
          if (noOfDays == 0) noOfDays = 1;

          this.reservation.rooms.forEach((room: any) => {
            let x = {
              roomNumber: room.roomNumber,
              price: room.pricePerDay,
              qty: noOfDays,
              total: room.pricePerDay * noOfDays,
            };
            this.rooms.push(x);
            this.roomTotal += x.total;
          });
          if (this.reservation != null) {
            let total = this.reservation.billing.orders.reduce(
              (a: any, o: any) => a + o.qty * o.price,
              0
            );
            total+=this.roomTotal;
            if (this.reservation.billing.discountPercentage > 0)
              this.discount =
                Math.round(
                  (Number(total) / 100) *
                    this.reservation.billing.discountPercentage
                );
                this.discount +=  this.reservation.billing.flatDiscount;
            if (this.reservation.billing.taxPercentage > 0)
              this.tax = Math.round(
                ((total - Number(this.discount)) / 100) *
                  this.reservation.billing.taxPercentage
              );
            this.totalPayable = Math.round(
              total - Number(this.discount) + Number(this.tax)
            );
          }
        },
      });
  }
  getOrderAmount() {
    this.subTotal = this.reservation.billing.orders.reduce(
      (a: any, o: any) => a + o.qty * o.price,
      0
    );
  }
}
