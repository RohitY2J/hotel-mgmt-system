import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
    {title: 'Login', component: LoginComponent, path:'login'},
    {title: 'Dashboard', component: DashboardComponent, path:'**'},
    
];
