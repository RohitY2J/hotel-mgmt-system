import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpService } from '../../services/http-service.service';
import { finalize, Subject, takeUntil, interval } from 'rxjs';
import { LoaderComponent } from '../shared/loader/loader.component';
import { NotificationComponent } from '../shared/notification/notification.component';
import { HttpListResponse } from '../../models/HttpResponse';
import { SocketService } from '../../socket.service';

interface MenuItem {
  id: string;
  name: string;
  qty: number;
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready';
}

interface Table {
  id: string;
  tableNumber: number;
}

interface Order {
  id: string;
  table: Table;
  orders: MenuItem[];
  timestamp: Date;
  status: 'pending' | 'in-progress' | 'ready' | 'completed';
  estimatedTime?: number; // minutes
  createdAt?: string;
}

interface NotificationData {
  error?: boolean;
  success?: boolean;
  warning?: boolean;
  message: string;
  duration?: number;
}

interface OrderFilter {
  status: number;
  tableNumber?: number;
  dateFrom?: string;
  dateTo?: string;
}

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    NotificationComponent
  ],
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.scss'
})
export class KitchenComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  showNotification: boolean = false;
  notificationParams: any = { message: '' };
  orders: Order[] = [];
  
  filter: OrderFilter = {
    status: 0
  };

  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService, 
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.fetchOrderItems();
    this.initializeSocketListeners();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize socket listeners for real-time updates
   */
  private initializeSocketListeners(): void {
    this.socketService.listenOrderUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe((order) => {
        this.handleOrderUpdate(order);
      });
  }

  /**
   * Auto-refresh orders every 30 seconds as fallback
   */
  private startAutoRefresh(): void {
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.fetchOrderItems();
      });
  }

  /**
   * Handle real-time order updates from socket
   */
  private handleOrderUpdate(updatedOrder: any): void {
    const existingOrderIndex = this.orders.findIndex(order => order.id === updatedOrder.id);
    
    if (existingOrderIndex >= 0) {
      // Update existing order
      this.orders[existingOrderIndex] = this.processOrderData(updatedOrder);
    } else {
      // Add new order
      this.orders.unshift(this.processOrderData(updatedOrder));
    }
    
    // Sort orders by priority after update
    this.sortOrdersByPriority();
  }

  /**
   * Fetch orders from API
   */
  fetchOrderItems(): void {
    this.isLoading = true;
    this.showNotification = false;
    
    this.httpService.httpPost("order/getOrders", this.filter)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          const responseData = response as HttpListResponse;
          this.orders = responseData.data.map(order => this.processOrderData(order));
          this.sortOrdersByPriority();
        },
        error: (err) => {
          console.error('Error fetching orders:', err);
          this.triggerNotification({
            error: true,
            message: "Failed to retrieve orders",
            duration: 5000
          });
        }
      });
  }

  /**
   * Process raw order data from API
   */
  private processOrderData(rawOrder: any): Order {
    return {
      id: rawOrder.id,
      table: {
        id: rawOrder.table?.id || rawOrder.tableId,
        tableNumber: rawOrder.table?.tableNumber || rawOrder.tableNumber
      },
      orders: rawOrder.orders || rawOrder.items || [],
      timestamp: new Date(rawOrder.createdAt || rawOrder.timestamp || Date.now()),
      status: rawOrder.status || 'pending',
      estimatedTime: rawOrder.estimatedTime || this.calculateEstimatedTime(rawOrder.orders || rawOrder.items || []),
      createdAt: rawOrder.createdAt
    };
  }

  /**
   * Calculate estimated preparation time based on menu items
   */
  private calculateEstimatedTime(items: MenuItem[]): number {
    // Basic estimation - you can make this more sophisticated
    const baseTime = 10; // 10 minutes base time
    const itemTime = items.reduce((total, item) => total + (item.qty * 2), 0); // 2 min per item
    return Math.min(baseTime + itemTime, 45); // Cap at 45 minutes
  }

  /**
   * Track by function for orders ngFor
   */
  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  /**
   * Track by function for menu items ngFor
   */
  trackByMenuItem(index: number, item: MenuItem): string {
    return item.id || `${index}-${item.name}`;
  }

  /**
   * Mark an order as ready
   */
  markOrderReady(order: Order): void {
    if (this.isLoading || order.status === 'ready') return;

    //this.isLoading = true;
    
    const updateData = {
      orderId: order.id,
      status: 'ready'
    };

    // this.httpService.httpPost("order/updateOrderStatus", updateData)
    //   .pipe(
    //     finalize(() => {
    //       this.isLoading = false;
    //     }),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe({
    //     next: (response) => {
    //       order.status = 'ready';
    //       this.triggerNotification({
    //         success: true,
    //         message: `Table ${order.table.tableNumber} order marked as ready`,
    //         duration: 3000
    //       });
          
    //       // Remove order from kitchen display after delay
    //       setTimeout(() => {
    //         this.removeOrderFromDisplay(order.id);
    //       }, 3000);
    //     },
    //     error: (err) => {
    //       console.error('Error marking order ready:', err);
    //       this.triggerNotification({
    //         error: true,
    //         message: 'Failed to mark order as ready',
    //         duration: 5000
    //       });
    //     }
    //   });
  }

  /**
   * View order details
   */
  viewOrderDetails(order: Order): void {
    // You can implement modal or navigation here
    console.log('Viewing details for order:', order);
    
    // Example implementation:
    // this.router.navigate(['/kitchen/order', order.id]);
    // or open a modal with detailed information
    
    // this.triggerNotification({
    //   message: `Viewing details for Table ${order.table.tableNumber}`,
    //   duration: 2000
    // });
  }

  /**
   * Update order item status
   */
  updateMenuItemStatus(order: Order, menuItem: MenuItem, newStatus: 'pending' | 'preparing' | 'ready'): void {
    const updateData = {
      orderId: order.id,
      itemId: menuItem.id,
      status: newStatus
    };

    this.httpService.httpPost("order/updateItemStatus", updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          menuItem.status = newStatus;
          
          // Check if all items are ready
          const allItemsReady = order.orders.every(item => item.status === 'ready');
          if (allItemsReady && order.status !== 'ready') {
            order.status = 'ready';
          }
        },
        error: (err) => {
          console.error('Error updating item status:', err);
          this.triggerNotification({
            error: true,
            message: 'Failed to update item status',
            duration: 3000
          });
        }
      });
  }

  /**
   * Remove order from display
   */
  private removeOrderFromDisplay(orderId: string): void {
    this.orders = this.orders.filter(order => order.id !== orderId);
  }

  /**
   * Get estimated completion time for an order
   */
  getEstimatedTime(order: Order): string {
    if (!order.estimatedTime) return 'N/A';
    
    const now = new Date();
    const orderTime = new Date(order.timestamp);
    const elapsedMinutes = Math.floor((now.getTime() - orderTime.getTime()) / 60000);
    const remainingTime = order.estimatedTime - elapsedMinutes;
    
    if (remainingTime <= 0) return 'Overdue';
    return `${remainingTime} min`;
  }

  /**
   * Get order priority based on wait time
   */
  getOrderPriority(order: Order): 'high' | 'medium' | 'low' {
    const now = new Date();
    const orderTime = new Date(order.timestamp);
    const elapsedMinutes = Math.floor((now.getTime() - orderTime.getTime()) / 60000);
    
    if (elapsedMinutes > 30) return 'high';
    if (elapsedMinutes > 15) return 'medium';
    return 'low';
  }

  /**
   * Get total quantity for an order
   */
  getTotalQuantity(order: Order): number {
    return order.orders.reduce((total, item) => total + item.qty, 0);
  }

  /**
   * Get order age in minutes
   */
  getOrderAge(order: Order): number {
    const now = new Date();
    const orderTime = new Date(order.timestamp);
    return Math.floor((now.getTime() - orderTime.getTime()) / 60000);
  }

  /**
   * Sort orders by priority (oldest/highest priority first)
   */
  sortOrdersByPriority(): void {
    this.orders.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const priorityA = priorityOrder[this.getOrderPriority(a)];
      const priorityB = priorityOrder[this.getOrderPriority(b)];
      
      // First sort by priority, then by age
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      return this.getOrderAge(b) - this.getOrderAge(a);
    });
  }

  /**
   * Refresh orders manually
   */
  refreshOrders(): void {
    this.fetchOrderItems();
    this.triggerNotification({
      success: true,
      message: 'Orders refreshed',
      duration: 2000
    });
  }

  /**
   * Filter orders by status
   */
  filterOrdersByStatus(status: number): void {
    this.filter.status = status;
    this.fetchOrderItems();
  }

  /**
   * Get status display text
   */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'completed': 'Completed'
    };
    return statusMap[status] || status;
  }

  /**
   * Check if order is overdue
   */
  isOrderOverdue(order: Order): boolean {
    return this.getOrderAge(order) > 30;
  }

  /**
   * Get priority color class
   */
  getPriorityColorClass(priority: 'high' | 'medium' | 'low'): string {
    const colorMap = {
      'high': 'bg-red-400',
      'medium': 'bg-yellow-400',
      'low': 'bg-green-400'
    };
    return colorMap[priority];
  }

  /**
   * Handle order completion
   */
  completeOrder(order: Order): void {
    const updateData = {
      orderId: order.id,
      status: 'completed'
    };

    this.httpService.httpPost("order/completeOrder", updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          order.status = 'completed';
          this.triggerNotification({
            success: true,
            message: `Table ${order.table.tableNumber} order completed`,
            duration: 3000
          });
          
          // Remove from display after delay
          setTimeout(() => {
            this.removeOrderFromDisplay(order.id);
          }, 2000);
        },
        error: (err) => {
          console.error('Error completing order:', err);
          this.triggerNotification({
            error: true,
            message: 'Failed to complete order',
            duration: 5000
          });
        }
      });
  }

  /**
   * Trigger notification with proper typing
   */
  triggerNotification(notificationContent: NotificationData): void {
    this.notificationParams = notificationContent;
    this.showNotification = true;

    // Auto-hide notification after duration
    const duration = notificationContent.duration || 4000;
    setTimeout(() => {
      this.showNotification = false;
    }, duration);
  }

  /**
   * Handle socket connection errors
   */
  private handleSocketError(error: any): void {
    console.error('Socket connection error:', error);
    this.triggerNotification({
      warning: true,
      message: 'Real-time updates may be delayed',
      duration: 5000
    });
  }

  /**
   * Retry failed operations
   */
  retryOperation(): void {
    this.fetchOrderItems();
  }

  /**
   * Format timestamp for display
   */
  formatOrderTime(order: Order): string {
    const date = new Date(order.timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Check if component has active orders
   */
  hasActiveOrders(): boolean {
    return this.orders.length > 0;
  }

  /**
   * Get orders count by status
   */
  getOrdersCountByStatus(status: string): number {
    return this.orders.filter(order => order.status === status).length;
  }

  /**
   * Clear all completed orders
   */
  clearCompletedOrders(): void {
    const completedOrders = this.orders.filter(order => order.status === 'completed');
    
    if (completedOrders.length === 0) {
      this.triggerNotification({
        warning: true,
        message: 'No completed orders to clear',
        duration: 2000
      });
      return;
    }

    this.orders = this.orders.filter(order => order.status !== 'completed');
    
    this.triggerNotification({
      success: true,
      message: `Cleared ${completedOrders.length} completed orders`,
      duration: 3000
    });
  }

  /**
   * Emergency refresh - force reload all data
   */
  emergencyRefresh(): void {
    this.isLoading = true;
    this.orders = [];
    
    // Reconnect socket if needed
    //this.socketService.reconnect?.();
    
    setTimeout(() => {
      this.fetchOrderItems();
    }, 1000);
  }

  /**
   * Filter orders by table number
   */
  filterByTable(tableNumber: number): void {
    this.filter = {
      ...this.filter,
      tableNumber: tableNumber
    };
    this.fetchOrderItems();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filter = { status: 0 };
    this.fetchOrderItems();
    
    this.triggerNotification({
      message: 'Filters cleared',
      duration: 2000
    });
  }

  /**
   * Start preparing an order
   */
  startPreparing(order: Order): void {
    const updateData = {
      orderId: order.id,
      status: 'in-progress'
    };

    this.httpService.httpPost("order/updateOrderStatus", updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          order.status = 'in-progress';
          this.triggerNotification({
            success: true,
            message: `Started preparing Table ${order.table.tableNumber}`,
            duration: 2000
          });
        },
        error: (err) => {
          console.error('Error starting order preparation:', err);
          this.triggerNotification({
            error: true,
            message: 'Failed to update order status',
            duration: 3000
          });
        }
      });
  }

  /**
   * Handle network errors gracefully
   */
  private handleNetworkError(error: any): void {
    if (error.status === 0) {
      this.triggerNotification({
        error: true,
        message: 'Network connection lost. Retrying...',
        duration: 5000
      });
      
      // Retry after delay
      setTimeout(() => {
        this.retryOperation();
      }, 3000);
    }
  }

  /**
   * Get order card CSS classes based on priority
   */
  getOrderCardClasses(order: Order): string {
    const baseClasses = 'bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1';
    const priority = this.getOrderPriority(order);
    
    switch (priority) {
      case 'high':
        return `${baseClasses} border-red-300 ring-2 ring-red-400`;
      case 'medium':
        return `${baseClasses} border-yellow-300`;
      default:
        return `${baseClasses} border-slate-200`;
    }
  }

  /**
   * Get status badge classes
   */
  getStatusBadgeClasses(status: string): string {
    const baseClasses = 'w-2 h-2 rounded-full';
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-orange-400`;
      case 'in-progress':
      case 'preparing':
        return `${baseClasses} bg-blue-400`;
      case 'ready':
        return `${baseClasses} bg-green-400`;
      case 'completed':
        return `${baseClasses} bg-gray-400`;
      default:
        return `${baseClasses} bg-gray-400`;
    }
  }

  /**
   * Get quantity badge classes based on item status
   */
  getQuantityBadgeClasses(item: MenuItem): string {
    const baseClasses = 'inline-flex items-center justify-center w-8 h-8 text-white text-sm font-bold rounded-full';
    
    switch (item.status) {
      case 'preparing':
        return `${baseClasses} bg-yellow-600`;
      case 'ready':
        return `${baseClasses} bg-green-600`;
      default:
        return `${baseClasses} bg-blue-600`;
    }
  }
}