import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { initFlowbite  } from 'flowbite';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  constructor(private authService: AuthService) {}
  collapseShow = "hidden";
  clientName = "Default";
  ngOnInit(): void {
    let x = this.authService.getUser()?.clientApplicationId ?? "";
    initFlowbite();
  }
  logout() {
    this.authService.logout();
  }
  toggleCollapseShow(classes: any) {
    this.collapseShow = classes;
  }
}
