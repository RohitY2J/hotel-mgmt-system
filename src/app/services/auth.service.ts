// import { Injectable } from '@angular/core';
// import { HttpService } from './http-service.service';
// import { Router } from '@angular/router';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private userDetails:any = {};
//   constructor(private httpService: HttpService, private router: Router) { }

//   login(loginRequest: any) {
//     this.httpService.httpPost('login', loginRequest).subscribe({
//       next: (res) => this.router.navigateByUrl('/admin/dashboard'),
//       error: (err) => console.log,
//     });
//   }
//   logout() {
//     this.httpService.httpGet('logout').subscribe({
//       next: (res) => this.router.navigateByUrl('/login'),
//       error: (err) => console.log,
//     });
//   }
//   isAuthenticated() {
//     return new Promise((resolve, reject) => {
//       this.httpService.httpGet(`isAuthenticated`).subscribe({
//         next: (res: any) => resolve(res['isAuthenticated']),
//         error: (err) => reject(false),
//       });
//     });
//   }

//   setUserRole() {
//     return new Promise((resolve, reject) => {
//       this.getUserDetails().subscribe({
//         next: (res: any) => {
//           this.userDetails = res; // Assuming the response has a 'role' property
//           localStorage.setItem('clientName',this.userDetails?.client?.clientName)
//           resolve(this.userDetails);
//         },
//         error: (err) => reject({}),
//       });
//     });
//   }

//   getUserDetails(): Observable<any> {
//     return this.httpService.httpGet('getUserDetails');
//   }

//   getUser(): any {
//     return this.userDetails;
//   }

// }


import { Injectable } from '@angular/core';
import { HttpService } from './http-service.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { UserInfo, UserService } from './user_context.service';
import axios from 'axios';
import { environment } from '../../../env/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //private userDetails: UserInfo | null = null;

  constructor(
    private httpService: HttpService,
    private router: Router,
    private userService: UserService
  ) {
    // Sync userDetails with UserService on initialization
    this.userService.user$.subscribe(user => {
      //this.userDetails = user;
      if (user?.clientApplicationId) {
        localStorage.setItem('clientName', user.tenantName); // Adjust based on actual clientName source
      } else {
        localStorage.removeItem('clientName');
      }
    });
  }

  // login(loginRequest: { email: string; password: string, appId: string, redirectUri: string }){
  //   loginRequest.redirectUri = 'http://localhost:8000/callback';
  //   loginRequest.appId = '257bb609-a2fa-4093-beb7-655077bc1745';
  //   this.httpService.httpPost('login', loginRequest).subscribe({
  //       next: (res: any) => this.router.navigate(['/callback'], {
  //                             queryParams: { code:  res.code},
  //                           }),
  //       error: (err) => console.log(err),
  //   });
  // }

  handleCallback(code: string){
    return axios.post(`${environment.casServerUrl}/api/auth/Token`, { code }).then(
      (response: any) => {
        const accessToken = response.data.accessToken;
        const idToken = response.data.idToken;
        localStorage.setItem('accessToken', accessToken);
        if (idToken) localStorage.setItem('idToken', idToken);

        try {
          const decoded: { user: string; email: string; role: string | string[]; aud: string; tenantId: string; tenantName: string } = jwtDecode(accessToken);
          const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
          const user: UserInfo = {
            userId: decoded.user,
            email: decoded.email,
            roles,
            clientApplicationId: decoded.aud,
            tenantId: decoded.tenantId,
            tenantName: decoded.tenantName
          };
          this.userService.setUser(user);
          //this.userDetails = user;
          localStorage.setItem('clientName', decoded.tenantName);
          localStorage.removeItem('loginRequest');
          this.router.navigateByUrl('/admin/dashboard');
        } catch (error) {
          console.error('Failed to decode JWT:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('idToken');
          localStorage.removeItem('clientName');
          this.userService.setUser(null);
          //this.userDetails = null;
          this.router.navigateByUrl('/login');
          throw error;
        }
      })
      .catch((err:any) => {
        console.log(err);
        this.router.navigateByUrl('/login');
      });
  }


  logout(){

    localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('clientName');
        this.userService.setUser(null);
        //this.userDetails = null;
        this.router.navigateByUrl('/login');
    // return this.httpService.httpGet('User/Logout').pipe(
    //   tap(() => {
        
    //   })
    // );
  }

  isAuthenticated(): Promise<boolean> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return Promise.resolve(false);
    }
    else{
      return Promise.resolve(true);
    }
    try {
      const decoded: { exp: number } = jwtDecode(accessToken!!);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('clientName');
        this.userService.setUser(null);
        //this.userDetails = null;
        return Promise.resolve(false);
      }
      return Promise.resolve(!!this.userService.getUser());
    } catch (error) {
      console.error('Invalid token:', error);
      return Promise.resolve(false);
    }
  }

  setUserRole(): Promise<UserInfo | null> {
    return new Promise((resolve, reject) => {
      // this.getUserDetails().subscribe({
      //   next: (res: any) => {
      //     const user: UserInfo = {
      //       userId: res.userId,
      //       email: res.email,
      //       roles: Array.isArray(res.roles) ? res.roles : [res.roles],
      //       clientApplicationId: res.clientApplicationId
      //     };
      //     this.userDetails = user;
      //     this.userService.setUser(user);
      //     localStorage.setItem('clientName', res.client?.clientName || res.clientApplicationId);
      //     resolve(user);
      //   },
      //   error: (err) => {
      //     console.error('Failed to fetch user details:', err);
      //     reject(null);
      //   }
      // });
    });
  }

  // getUserDetails(): Observable<any> {
  //   return this.httpService.httpGet('User/GetUserDetails');
  // }

  getUser(): UserInfo | null {
    let accessToken = localStorage.getItem("accessToken");
    if(!accessToken){
      return null;
    }
    const decoded: { user: string; email: string; role: string | string[]; aud: string; tenantId: string; tenantName: string } = jwtDecode(accessToken);
    const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
    const user: UserInfo = {
      userId: decoded.user,
      email: decoded.email,
      roles,
      clientApplicationId: decoded.aud,
      tenantId: decoded.tenantId,
      tenantName: decoded.tenantName
    };
    return user;
  }
}