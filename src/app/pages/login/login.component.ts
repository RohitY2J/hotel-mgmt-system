import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { environment } from '../../../../env/environment';
import axios  from 'axios';

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
    //if (this.loginRequest.invalid) this.isFormValid = false;
    if (this.loginRequest.invalid) {
      this.isFormValid = false;
      return;
    }
    this.isLoading = true;

    axios.post(`${environment.CAS_SERVER_URL}/api/auth/authorize`, {
      email: this.loginRequest.value.email,
      password: this.loginRequest.value.password,
      redirectUri: `${environment.REDIRECT_URI}`,
      appId: environment.APPLICATION_ID,
      tenantId: environment.TENANT_ID
    }).then(response => {
      console.log(response.data)
      this.router.navigate(['/callback'], {queryParams: { code:  response.data.code}})
      this.notificationParams = {message: `Logged in successfully.`, error: false}
    }
    ).catch(err => {
      console.log(err);
      this.notificationParams = {message: `Error logging in: ${err?.error?.msg}`, error: true}
    })
    .finally( () => {
      this.isLoading = false;
    } )
  }
}
