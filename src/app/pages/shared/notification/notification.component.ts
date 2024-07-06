import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
  dismiss: Dismiss | null = null;
  toastCustomClass: string = "";
  iconCustomClass: string = "";
  
  ngOnInit(): void {

    if(this.notificationData.error){
      this.toastCustomClass = "dark:bg-red-500";
      this.iconCustomClass = "fa-regular fa-circle-xmark fa-lg";
    }
    else{
      this.toastCustomClass = "dark:bg-green-500";
      this.iconCustomClass="fa-regular fa-circle-check fa-lg"
    }

    const $targetEl: HTMLElement | null = document.getElementById('toast-success');
    
    // options object
    const options: DismissOptions = {
      transition: 'transition-opacity',
      duration: 0,
      timing: 'ease-out',
      
      // callback functions
      onHide: (context, targetEl) => {
        console.log('element has been dismissed')
      }
    };
    
    if ($targetEl) {
      this.dismiss = new Dismiss($targetEl, null, options);
      
      // Hide the element after 3 seconds
      setTimeout(() => {
        this.dismiss?.hide();
      }, 4000);
    }
  }

  dismissToast(){
    console.log("Dismiss Toast clicked");
    this.dismiss?.hide();
  }
}
