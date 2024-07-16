import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';
import { HttpService } from '../../services/http-service.service';
import { CommonModule } from '@angular/common';
import { HttpListResponse } from '../../models/HttpResponse';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-food-invoice-layout',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './food-invoice-layout.component.html',
  styleUrl: './food-invoice-layout.component.scss'
})
export class FoodInvoiceLayoutComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService
  ) { }
  reservationId: string | null = "";
  reservation: any;
  discount: Number = 0;
  tax: Number = 0;
  totalPayable: Number = 0;
  invoiceDate: any = Date.now();
  table: any = {};

  filter: any = {};

  amount: any = {
    subTotal: 0,
    discountAmt: 0,
    taxAmt: 0,
    totalPayable: 0
  };

  async ngOnInit(){
    this.filter.id = this.route.snapshot.queryParamMap.get('id');
    await this.getOrderForBilling();
    setTimeout(() => {
      window.print();
    }, 1000);
  }

  async getOrderForBilling() {
    this.httpService
      .httpPost(`order/getOrders`, this.filter)
      .subscribe({
        next: (res) => {
          this.table = (res as HttpListResponse).data[0];
          this.amount.subTotal = this.table.orders.reduce((accumulator: any, order: any) => accumulator + (order.price * order.qty), 0);
          if(this.table.discountType == 0 ){
            this.amount.discountAmt = this.table.discountPercent *  this.amount.subTotal/ 100;
          }
          else{
            this.amount.discountAmt = this.table.discountAmt;
          }
          if(this.table.discountType == 0){
            let amtAfterDiscount = this.amount.subTotal - this.amount.discountAmt;
            this.amount.taxAmt = this.table.tax *  amtAfterDiscount/ 100 
          }
          else{
            this.amount.taxAmt = this.table.taxAmt;
          }
          this.amount.totalPayable = this.amount.subTotal - this.amount.discountAmt + this.amount.taxAmt;
        },
        error: (err) => {
          console.log(err);
        }
      });
  }

}
