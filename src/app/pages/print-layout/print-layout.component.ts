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
  invoiceDate: any = Date.now();
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
          if (this.reservation != null) {
            let total = this.reservation.billing.orders.reduce(
              (a: any, o: any) => a + o.amount,
              0
            );
            if (this.reservation.billing.discountPercentage > 0)
              this.discount =
                Math.round((Number(total) / 100) * this.reservation.billing.discountPercentage);
            if (this.reservation.billing.taxPercentage > 0)
              this.tax =
                Math.round(((total - Number(this.discount)) / 100) *
                this.reservation.billing.taxPercentage);
            this.totalPayable =
            Math.round(total - Number(this.discount) + Number(this.tax));
              console.log(this.discount, this.tax, this.totalPayable);
          }
        },
      });
  }
  getOrderAmount(){
    return this.reservation.billing.orders.reduce(
      (a:any,o:any)=> a + o.amount, 0
  );
}
}
