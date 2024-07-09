import { Injectable } from '@angular/core';
import { HttpService } from './http-service.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userDetails = {};
  constructor(private httpService: HttpService, private router: Router) { }

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

  setUserRole() {
    return new Promise((resolve, reject) => {
      this.getUserDetails().subscribe({
        next: (res: any) => {
          this.userDetails = res; // Assuming the response has a 'role' property
          resolve(this.userDetails);
        },
        error: (err) => reject({}),
      });
    });
  }

  getUserDetails(): Observable<any> {
    return this.httpService.httpGet('getUserDetails');
  }

  getUser(): any {
    return this.userDetails;
  }

}
