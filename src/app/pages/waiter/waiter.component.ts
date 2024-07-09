import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-waiter',
  standalone: true,
  imports: [CommonModule,
    FormsModule
  ],
  templateUrl: './waiter.component.html',
  styleUrl: './waiter.component.scss'
})
export class WaiterComponent {
  tableNumber: number = 0;
  status: string = 'available';

  closeModal() {
  }

  onSubmit() {
    // Handle form submission, e.g., send data to the server
    console.log('Table Number:', this.tableNumber);
    console.log('Status:', this.status);
    this.closeModal();
  }
}
