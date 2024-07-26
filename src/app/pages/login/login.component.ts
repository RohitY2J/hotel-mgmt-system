import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, NotificationComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  isFormValid: boolean = true;
  isLoading: boolean = false;
  loginRequest = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });
  notificationParams: any = {};
  
  showNotification: boolean = false;
  constructor(
    private httpService: HttpService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {}


  login() {
    if (this.loginRequest.invalid) this.isFormValid = false;
    this.isLoading = true;
    this.httpService.httpPost('login', this.loginRequest.value)
    .pipe(finalize(()=>{
      this.isLoading = false;
      this.showNotification = true;
    }))
    .subscribe({
      next: (res) => {
        this.router.navigateByUrl('/admin/dashboard')
        this.notificationParams = {message: `Logged in successfully.`, error: false}
      },
      error: (err) =>{
        console.log('err', err);
        this.notificationParams = {message: `Error logging in: ${err?.error?.msg}`, error: true}
      }
    });
  }
}
