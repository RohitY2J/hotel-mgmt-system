import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { EmployeeAttendanceComponent } from './pages/employee-attendance/employee-attendance.component';

export const routes: Routes = [
    {title: 'Login', component: LoginComponent, path:'login'},
    {title: 'Employee', component: EmployeeComponent, path:'admin/employee'},
    {title: 'Dashboard', component: DashboardComponent, path:'admin/dashboard'},
    {title: 'Employee Attendance', component: EmployeeAttendanceComponent, path:'admin/employee-attendance'}
];
