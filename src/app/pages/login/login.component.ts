import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http-service.service';
import { NotificationComponent } from '../shared/notification/notification.component';
import { finalize } from 'rxjs';
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
      redirectUri: `${environment.SERVER_URL}/callback`,
      appId: environment.APPLICATION_ID
    }).then(response => {
      this.isLoading = false;
      console.log(response.data)
      this.router.navigate(['/callback'], {queryParams: { code:  response.data.code}})
    }
    ).catch(err => {
      console.log(err);
    })

    // this.httpService.httpPostCAS('authorize/auth', {
    //   email: this.loginRequest.value.email,
    //   password: this.loginRequest.value.password,
    //   redirectUri: 'http://localhost:8000/callback',
    //   appId: '257bb609-a2fa-4093-beb7-655077bc1745'
    // })
    // .pipe(finalize(()=>{
    //   this.isLoading = false;
    //   this.showNotification = true;
    // }))
    // .subscribe({
    //   next: (res: any) => {
    //     //this.router.navigateByUrl('/admin/dashboard')
    //     //this.notificationParams = {message: `Logged in successfully.`, error: false}
    //     this.router.navigate(['/callback'], {queryParams: { code:  res.code}})
    //   },
    //   error: (err) =>{
    //     console.log('err', err);
    //     this.notificationParams = {message: `Error logging in: ${err?.error?.msg}`, error: true}
    //   }
    // });
  }
}
