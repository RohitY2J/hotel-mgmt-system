import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { HttpService } from '../../services/http-service.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SidebarComponent, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  
  dashboardData: any = {};

  constructor(private httpService: HttpService){}
  ngOnInit(): void {
    this.httpService.httpGet('/dashboard/getDashboardData').subscribe(
      (res) => {
        this.dashboardData = res;
      },
      (err) => {

      }
    )
  }
  date: Date = new Date();
}
