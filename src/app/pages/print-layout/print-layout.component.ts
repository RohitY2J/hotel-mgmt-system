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
id: string = "";

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService
  ) {}
  reservationId: any;
  reservation: any;
 async ngOnInit() {
    this.reservationId = this.route.snapshot.queryParamMap.get('id');
    console.log(this.reservationId);
    await this.getReservation();
    setTimeout(()=>{
      window.print();
    }, 100);
  }
  async getReservation() {
    this.httpService
      .httpGet(`reservation/getReservationById?id=${this.reservationId}`)
      .subscribe({
        next: (res) => {
          this.reservation = res;
          if(this.reservation != null){

            // window.print();
          }
        },
      });
  }
}
