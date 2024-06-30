import { Injectable } from '@angular/core';
import { HttpService } from './http-service.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private httpService: HttpService, private router: Router) {}

  login(loginRequest: any) {
    this.httpService.httpPost('login', loginRequest).subscribe({
      next: (res) => this.router.navigateByUrl('/admin/dashboard'),
      error: (err) => console.log,
    });
  }
  logout() {
    this.httpService.httpGet('logout').subscribe({
      next: (res) => this.router.navigateByUrl('/login'),
      error: (err) => console.log,
    });
  }
  isAuthenticated() {
    return new Promise((resolve, reject) => {
      this.httpService.httpGet(`isAuthenticated`).subscribe({
        next: (res: any) => resolve(res['isAuthenticated']),
        error: (err) => reject(false),
      });
    });
  }
}
