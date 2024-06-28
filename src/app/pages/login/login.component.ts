import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpService } from '../../services/http-service.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent  implements OnInit{
  isFormValid:boolean = true;
  loginRequest = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required,)
  });
  constructor(private httpService: HttpService, private router: Router) {
    
  }
  ngOnInit() {
    
  }

  login(){
    if(this.loginRequest.invalid) this.isFormValid = false;
    this.httpService.httpPost('login',this.loginRequest.value).subscribe({
      next: ()=> this.router.navigateByUrl("/admin/dashboard"),
      error: (err)=> console.log,
    
    })
  }
}
