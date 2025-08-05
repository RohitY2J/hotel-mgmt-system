import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { HttpService } from '../../services/http-service.service';
import ApexCharts from 'apexcharts';
import { finalize } from 'rxjs';
import { LoaderComponent } from '../shared/loader/loader.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SidebarComponent, NavbarComponent, LoaderComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  @ViewChild('lineChart', { static: true }) lineChart: ElementRef | null = null;
  dashboardData: any = {};
  private chart: ApexCharts | null = null; // Define a private chart instance
  public options: any = {}; // Your chart options
  totalReservationThisWeek: Number = 0;
  totalOrderThisWeek: Number = 0;
  isLoading: boolean = false;

  constructor(private httpService: HttpService) {}
  ngOnInit(): void {

    this.options = {
      chart: {
        height: "100%",
        maxWidth: "100%",
        type: "line",
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      tooltip: {
        enabled: true,
        x: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 1,
        curve: "smooth",
        colors: ["red"]
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: -26
        },
      },
      series: [],
      legend: {
        show: false
      },
      xaxis: {
        categories: ['01 Feb', '02 Feb', '03 Feb', '04 Feb', '05 Feb', '06 Feb', '07 Feb'],
        labels: {
          show: true,
          style: {
            fontFamily: "Inter, sans-serif",
            cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400',
          }
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        show: false,
      },
    }

    if (this.lineChart && typeof ApexCharts !== 'undefined') {
      this.chart = new ApexCharts(this.lineChart.nativeElement, this.options);
      this.chart.render();
    }

    this.isLoading = true;
    this.httpService.httpGet('dashboard/getDashboardData')
    .pipe(finalize(() => {
      this.isLoading = false;
    }))
    .subscribe(
      (res) => {
        this.dashboardData = res;
        let thisWeekReservationData = this.dashboardData.reservationThisWeek.map((x: { count: any; }) => x.count);
        let thisWeekOrder = this.dashboardData.orderThisWeek.map((x : {count : any}) => x.count);
        this.options.series = [
          {
            name: 'Reservations',
            data: thisWeekReservationData,
            color: "#1A56DB"
          },
          {
            name: 'Orders',
            data: thisWeekOrder,
            color: "#1Affff"
          }
        ]
        this.chart?.updateOptions({
          xaxis: { 
            categories: this.dashboardData.reservationThisWeek.map((x: { date: any; }) => x.date)
          }
        }, false, true); 
        this.chart?.updateSeries(this.options.series, true);
        this.totalReservationThisWeek = thisWeekReservationData.reduce((acc: number, count: number) => acc + count, 0);
        this.totalOrderThisWeek = thisWeekOrder.reduce((acc: number, order: number) => acc+order, 0);
      },
      (err) => {

      }
    )
  }
}
