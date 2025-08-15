// import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError, switchMap } from 'rxjs/operators';
// import { inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../../env/environment';
// import { jwtDecode } from 'jwt-decode';
// import { UserService } from './user_context.service';
// import axios from 'axios';

// export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
//   const router = inject(Router);
//   const httpClient = inject(HttpClient);
//   const userService = inject(UserService);
//   const apiUrl = environment.casServerUrl + '/api';

//   const updateUserFromToken = (accessToken: string | null): void => {
//     if (accessToken) {
//       try {
//         const decoded: { user: string; email: string; role: string | string[]; aud: string, tenantId: string, tenantName: string } = jwtDecode(accessToken);
//         const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
//         userService.setUser({
//           userId: decoded.user,
//           email: decoded.email,
//           roles,
//           clientApplicationId: decoded.aud,
//           tenantId: decoded.tenantId,
//           tenantName: decoded.tenantName
//         });
//       } catch (error) {
//         console.error('Failed to decode JWT:', error);
//         userService.setUser(null);
//       }
//     } else {
//       userService.setUser(null);
//     }
//   };

//   const handleTokenRefresh = async (req: HttpRequest<any>): Promise<void> => {
//     console.log("Calling handle token refresh");
//     const accessToken = localStorage.getItem('accessToken');
//     try{
//       const response = await axios.get(`${environment.casServerUrl}/api/auth/refreshToken`, {
//         headers: { Authorization: `Bearer ${accessToken}` }
//       });
  
//       const { data } = await axios.post(`${environment.casServerUrl}/api/auth/token`, {
//         code: response.data
//       }, 
//       {
//         headers: { 'Content-Type': 'application/json' }
//       });
  
//       localStorage.setItem('accessToken', data.accessToken);
//       if (data.idToken) localStorage.setItem('idToken', data.idToken);
//       updateUserFromToken(data.accessToken);
//       //config.headers = config.headers || {};
//     }
//     catch(error:any){
//         console.error('Token refresh failed:', error);
//         //localStorage.removeItem('accessToken');
//         //localStorage.removeItem('idToken');
//         //userService.setUser(null);
//         router.navigate(['/login']);
//         //return throwError(() => error);
//     };
//   };

//   const accessToken = localStorage.getItem('accessToken');
//   const idToken = localStorage.getItem('idToken');

//   let authReq = req;
//   if (accessToken) {
//     const decoded: { exp: number } = jwtDecode(accessToken);
//     const currentTime = Math.floor(Date.now() / 1000);

//     if (decoded.exp < currentTime && !req.url.includes('/api/User/GetRefreshToken')) {
//       handleTokenRefresh(req);
//     }

//     authReq = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${accessToken}`,
//         ...(idToken && { 'X-Id-Token': idToken })
//       }
//     });
//   }

//   return next(authReq).pipe(
//     catchError((error: HttpErrorResponse) => {
//       if (error.status === 401) {
//         console.error('Unauthorized, redirecting to login');
//         //localStorage.removeItem('accessToken');
//         //localStorage.removeItem('idToken');
//         //userService.setUser(null);
//         //router.navigate(['/login']);
//       } else if (error.status === 403) {
//         console.error('Forbidden: Insufficient permissions');
//         //router.navigate(['/unauthorized']);
//       }
//       return throwError(() => error);
//     })
//   );
// }


import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, switchMap, filter, take, map } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../env/environment';
import { jwtDecode } from 'jwt-decode';
import { UserService } from './user_context.service';
import axios, { AxiosResponse } from 'axios';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const router = inject(Router);
  const httpClient = inject(HttpClient);
  const userService = inject(UserService);
  const apiUrl = environment.CAS_SERVER_URL + '/api';
  let isRefreshing = false;
  const refreshTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>("");

  const updateUserFromToken = (accessToken: string | null): void => {
    if (accessToken) {
      try {
        const decoded: { user: string; email: string; role: string | string[]; aud: string; tenantId: string; tenantName: string } = jwtDecode(accessToken);
        const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
        userService.setUser({
          userId: decoded.user,
          email: decoded.email,
          roles,
          clientApplicationId: decoded.aud,
          tenantId: decoded.tenantId,
          tenantName: decoded.tenantName
        });
      } catch (error) {
        console.error('Failed to decode JWT:', error);
        userService.setUser(null);
      }
    } else {
      userService.setUser(null);
    }
  };

  const handleTokenRefresh = (): Observable<string> => {
    if (isRefreshing) {
      console.log('Token refresh already in progress, queuing request');
      return refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1)
      ) as Observable<string>;
    }

    isRefreshing = true;
    refreshTokenSubject.next("");
    console.log('Initiating token refresh');

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      isRefreshing = false;
      refreshTokenSubject.next("");
      router.navigate(['/login']);
      return throwError(() => new Error('No access token available'));
    }

    return from(axios.get(`${apiUrl}/auth/refreshToken`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })).pipe(
      switchMap((response: any) => {
        return from(axios.post<{ accessToken: string; idToken?: string; refreshToken: string }>(`${apiUrl}/auth/token`, {
          code: response.data
        }, {
          headers: { 'Content-Type': 'application/json' }
        })).pipe(
          map((res) => {
            console.log('Token refresh successful:', res.data.accessToken);
            localStorage.setItem('accessToken', res.data.accessToken);
            if (res.data.idToken) localStorage.setItem('idToken', res.data.idToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            updateUserFromToken(res.data.accessToken);
            isRefreshing = false;
            refreshTokenSubject.next(res.data.accessToken);
            return res.data.accessToken;
          })
        )
      }),
      catchError((error) => {
        console.error('Token refresh failed:', error);
        isRefreshing = false;
        refreshTokenSubject.next("");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        userService.setUser(null);
        router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  };

  const accessToken = localStorage.getItem('accessToken');
  const idToken = localStorage.getItem('idToken');

  let authReq = req;
  if (accessToken) {
    try {
      const decoded: { exp: number } = jwtDecode(accessToken);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp < currentTime && !req.url.includes('/api/auth/refreshToken') && !req.url.includes('/api/auth/token')) {
        return handleTokenRefresh().pipe(
          switchMap((newToken: string) => {
            authReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                ...(idToken && { 'X-Id-Token': idToken })
              }
            });
            return next(authReq);
          }),
          catchError((error) => {
            return throwError(() => error);
          })
        );
      }

      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
          ...(idToken && { 'X-Id-Token': idToken })
        }
      });
    } catch (error) {
      console.error('Invalid access token:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      userService.setUser(null);
      router.navigate(['/login']);
      return throwError(() => new Error('Invalid access token'));
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/auth/refreshToken') && !req.url.includes('/api/auth/token')) {
        console.error('Unauthorized, attempting token refresh');
        return handleTokenRefresh().pipe(
          switchMap((newToken: string) => {
            authReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                ...(idToken && { 'X-Id-Token': idToken })
              }
            });
            return next(authReq);
          })
        );
      } else if (error.status === 403) {
        console.error('Forbidden: Insufficient permissions');
        router.navigate(['/unauthorized']);
      }
      return throwError(() => error);
    })
  );
}


