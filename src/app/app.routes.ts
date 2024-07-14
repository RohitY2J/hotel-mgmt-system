import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { authGuard } from './services/auth.guard';
import { EmployeeAttendanceComponent } from './pages/employee-attendance/employee-attendance.component';
import { RoomComponent } from './pages/room/room.component';
import { LayoutComponent } from './pages/shared/layout/layout.component';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { PrintLayoutComponent } from './pages/print-layout/print-layout.component';
import { MenuItemComponent } from './pages/menu-item/menu-item.component';
import { WaiterComponent } from './pages/waiter/waiter.component';
import { OrderItemComponent } from './pages/order-item/order-item.component';
import { KitchenComponent } from './pages/kitchen/kitchen.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { OrderBillComponent } from './pages/order-bill/order-bill.component';
import { FoodInvoiceLayoutComponent } from './pages/food-invoice-layout/food-invoice-layout.component';

export const routes: Routes = [
    {title: 'Login', component: LoginComponent, path:'login', canActivate: [authGuard]},
    {
        path: 'admin',
        component: LayoutComponent,
        children: [
          {path: '', component: DashboardComponent, outlet: "main"},
          {title:'Dashboard', path: 'dashboard', component: DashboardComponent, outlet: "main" },
          {title: 'Employee', path: 'employee', component: EmployeeComponent, outlet:"main" },
          {title: 'Employee Attendance', component: EmployeeAttendanceComponent, path:'employee-attendance', outlet:"main"},
          {title: "Rooms", component: RoomComponent, path:'rooms', outlet:'main'},
          {title: "OrderBill", component: OrderBillComponent, path:'order-bill', outlet:'main'},
          {
            title: 'Reservation',
            component: ReservationComponent,
            path: 'reservations',
            canActivate: [authGuard],
            outlet: "main"
          },
          {
            title: 'Menus',
            component: MenuItemComponent,
            path: 'menus',
            canActivate: [authGuard],
            outlet: "main"
          },
          {
            title: 'Inventory',
            component: InventoryComponent,
            path: 'inventory',
            canActivate: [authGuard],
            outlet: "main"
          },
          { path: '**', redirectTo:"dashboard", outlet:'main', pathMatch:'full'}
        ],
        canActivate: [authGuard]
    },
    {
      path: 'waiter',
      component: WaiterComponent,
      canActivate: [authGuard]
    },
    {
      path: 'order',
      component: OrderItemComponent,
      canActivate: [authGuard]
    },
    {
      path: 'kitchen',
      component: KitchenComponent
    },

    {path: 'print-invoice', component: PrintLayoutComponent},
    {path: 'print-food-invoice', component: FoodInvoiceLayoutComponent},
    {path:'**', component:LoginComponent, canActivate: [authGuard]},
];
