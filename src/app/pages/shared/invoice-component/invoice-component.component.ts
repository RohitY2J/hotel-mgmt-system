import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-invoice-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-component.component.html',
  styleUrl: './invoice-component.component.scss'
})
export class InvoiceComponentComponent implements OnInit{
  ngOnInit(): void {
  }
  @Input({ required: true }) reservation!: any;

  getOrderAmount(){
    return this.reservation.billing.orders.reduce(
      (a:any,o:any)=> a + o.amount, 0
  );
}
}
