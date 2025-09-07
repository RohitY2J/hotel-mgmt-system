import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, OnDestroy } from '@angular/core';

export interface NotificationParameter {
  message: string;
  title?: string;
  error: boolean;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnDestroy {
  @Input() notificationData: NotificationParameter = {
    message: "Success",
    error: false,
    duration: 5000
  };

  toastVisible: boolean = false;
  progressWidth: number = 100;
  private timeoutId: any;
  private intervalId: any;
  private duration: number = 5000;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notificationData'] && 
        changes['notificationData'].currentValue && 
        Object.keys(changes['notificationData'].currentValue).length > 0) {
      this.duration = this.notificationData.duration || 5000;
      this.showToast();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  showToast(): void {
    this.clearTimers();
    this.toastVisible = true;
    this.progressWidth = 100;

    // Start progress animation
    const intervalDuration = 50;
    const steps = this.duration / intervalDuration;
    const progressStep = 100 / steps;
    let currentStep = 0;

    this.intervalId = setInterval(() => {
      currentStep++;
      this.progressWidth = 100 - (progressStep * currentStep);
      
      if (currentStep >= steps) {
        clearInterval(this.intervalId);
        this.hideToast();
      }
    }, intervalDuration);
  }

  dismissToast(): void {
    this.clearTimers();
    this.hideToast();
  }

  private hideToast(): void {
    this.toastVisible = false;
    this.progressWidth = 0;
  }

  getToastClasses(): string {
    const notificationType = this.getNotificationType();
    
    switch (notificationType) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/50 dark:backdrop-blur-md';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/50 dark:backdrop-blur-md';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50 dark:backdrop-blur-md';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50 dark:backdrop-blur-md';
      default:
        return 'bg-white border-gray-200 dark:bg-gray-800/20 dark:border-gray-600/50 dark:backdrop-blur-md';
    }
  }

  getIconContainerClasses(): string {
    const notificationType = this.getNotificationType();
    
    switch (notificationType) {
      case 'success':
        return 'bg-emerald-100 dark:bg-emerald-800/30';
      case 'error':
        return 'bg-red-100 dark:bg-red-800/30';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-800/30';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-800/30';
      default:
        return 'bg-gray-100 dark:bg-gray-700/30';
    }
  }

  getIconClasses(): string {
    const notificationType = this.getNotificationType();
    
    switch (notificationType) {
      case 'success':
        return 'fas fa-check text-emerald-600 dark:text-emerald-400';
      case 'error':
        return 'fas fa-times text-red-600 dark:text-red-400';
      case 'warning':
        return 'fas fa-exclamation-triangle text-amber-600 dark:text-amber-400';
      case 'info':
        return 'fas fa-info text-blue-600 dark:text-blue-400';
      default:
        return 'fas fa-bell text-gray-600 dark:text-gray-400';
    }
  }

  getTextClasses(): string {
    const notificationType = this.getNotificationType();
    
    switch (notificationType) {
      case 'success':
        return 'text-emerald-800 dark:text-emerald-100';
      case 'error':
        return 'text-red-800 dark:text-red-100';
      case 'warning':
        return 'text-amber-800 dark:text-amber-100';
      case 'info':
        return 'text-blue-800 dark:text-blue-100';
      default:
        return 'text-gray-800 dark:text-gray-100';
    }
  }

  getCloseButtonClasses(): string {
    const notificationType = this.getNotificationType();
    
    switch (notificationType) {
      case 'success':
        return 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-800/20';
      case 'error':
        return 'text-red-500 hover:text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-800/20';
      case 'warning':
        return 'text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-800/20';
      case 'info':
        return 'text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-800/20';
      default:
        return 'text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/20';
    }
  }

  getProgressBarClasses(): string {
    const notificationType = this.getNotificationType();
    
    switch (notificationType) {
      case 'success':
        return 'bg-emerald-500 dark:bg-emerald-400';
      case 'error':
        return 'bg-red-500 dark:bg-red-400';
      case 'warning':
        return 'bg-amber-500 dark:bg-amber-400';
      case 'info':
        return 'bg-blue-500 dark:bg-blue-400';
      default:
        return 'bg-gray-500 dark:bg-gray-400';
    }
  }

  private getNotificationType(): 'success' | 'error' | 'warning' | 'info' {
    if (this.notificationData.type) {
      return this.notificationData.type;
    }
    return this.notificationData.error ? 'error' : 'success';
  }
}