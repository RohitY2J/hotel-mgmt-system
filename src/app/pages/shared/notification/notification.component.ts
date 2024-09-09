import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { Dismiss, DismissOptions } from 'flowbite';
import { NotificationParameter } from '../../../models/Notification';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {

  @Input() notificationData: NotificationParameter = {
    message: "Success",
    error: true
  };
  toastVisible: boolean = false;
  dismiss: Dismiss | null = null;
  toastCustomClass: string = "";
  iconCustomClass: string = "";
  
  ngOnInit(): void {
    const $targetEl: HTMLElement | null = document.getElementById('toast-success');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.notificationData.error){
      this.toastCustomClass = "dark:bg-red-500";
      this.iconCustomClass = "fa-regular fa-circle-xmark fa-lg";
    }
    else{
      this.toastCustomClass = "dark:bg-green-500";
      this.iconCustomClass="fa-regular fa-circle-check fa-lg"
    }
    if (changes['notificationData'] && changes['notificationData'].currentValue && Object.keys(changes['notificationData'].currentValue).length > 0) {
      this.showToast();
    }
  }

  showToast() {
    this.toastVisible = true;
    setTimeout(() => {
      this.toastVisible = false;
    }, 5000); // Adjust timeout duration as needed
  }

  dismissToast() {
    this.toastVisible = false;
  }
}
