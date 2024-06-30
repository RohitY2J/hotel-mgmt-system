import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { authGuard } from './services/auth.guard';
import { EmployeeAttendanceComponent } from './pages/employee-attendance/employee-attendance.component';

export const routes: Routes = [
    {title: 'Dashboard', component: DashboardComponent, path:'admin/dashboard',canActivate: [authGuard]},
    {title: 'Login', component: LoginComponent, path:'login', canActivate: [authGuard]},
    {title: 'Employee', component: EmployeeComponent, path:'admin/employee', canActivate: [authGuard]},
    {title: 'Employee Attendance', component: EmployeeAttendanceComponent, path:'admin/employee-attendance',canActivate: [authGuard]},
    {title: "Dashboard Default", component: DashboardComponent, path:'**',canActivate: [authGuard]},
];
