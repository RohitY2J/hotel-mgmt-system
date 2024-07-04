import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EmployeeComponent } from './pages/employee/employee.component';
import { authGuard } from './services/auth.guard';
import { EmployeeAttendanceComponent } from './pages/employee-attendance/employee-attendance.component';
import { RoomComponent } from './pages/room/room.component';
import { LayoutComponent } from './pages/shared/layout/layout.component';
import { AnimationFrameScheduler } from 'rxjs/internal/scheduler/AnimationFrameScheduler';

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
          { path: '**', redirectTo:"dashboard", outlet:'main', pathMatch:'full'}
        ],
        canActivate: [authGuard]
    },
    {path:'**', component:LoginComponent, canActivate:[authGuard]},
];
