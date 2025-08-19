import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() isVisible: boolean = false;
  @Input() isTitleVisible: boolean = true;
  @Input() modalWidth: string = '500px';
  @Input() isLargeModal: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Input() applyBackdropFilter: boolean = false;

  closeModal() {
    this.isVisible = false;
    this.close.emit();
  }
}
