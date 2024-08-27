import { Component, Input } from '@angular/core';
import { ConstantsService } from '../../services/constants.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-grid.component.html',
  styleUrl: './reservation.component.scss',
})
export class ReservationGridComponent {
  @Input({ required: true }) reservations: any;
  
  _constService: ConstantsService;
  constructor(private constService: ConstantsService) {
    this._constService = constService;
  }
}
