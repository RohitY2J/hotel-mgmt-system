import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../env/environment';
import { jwtDecode } from 'jwt-decode';
import { UserService } from './user_context.service';

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const router = inject(Router);
  const httpClient = inject(HttpClient);
  const userService = inject(UserService);
  const apiUrl = environment.casServerUrl + '/api';

  const updateUserFromToken = (accessToken: string | null): void => {
    if (accessToken) {
      try {
        const decoded: { user: string; email: string; role: string | string[]; aud: string } = jwtDecode(accessToken);
        const roles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];
        userService.setUser({
          userId: decoded.user,
          email: decoded.email,
          roles,
          clientApplicationId: decoded.aud,
        });
      } catch (error) {
        console.error('Failed to decode JWT:', error);
        userService.setUser(null);
      }
    } else {
      userService.setUser(null);
    }
  };

  const handleTokenRefresh = (req: HttpRequest<any>): Observable<HttpEvent<any>> => {
    const accessToken = localStorage.getItem('accessToken');
    return httpClient.get(`${apiUrl}/User/GetRefreshToken`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      withCredentials: true
    }).pipe(
      switchMap((refreshData: any) => {
        const refreshToken = refreshData.refreshToken;
        return httpClient.post(`${apiUrl}/User/Refresh`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true
        }).pipe(
          switchMap((data: any) => {
            localStorage.setItem('accessToken', data.accessToken);
            if (data.idToken) localStorage.setItem('idToken', data.idToken);
            updateUserFromToken(data.accessToken);
            const authReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${data.accessToken}`,
                ...(data.idToken && { 'X-Id-Token': data.idToken })
              }
            });
            return next(authReq);
          })
        );
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
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
    const decoded: { exp: number } = jwtDecode(accessToken);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp < currentTime && !req.url.includes('/api/User/GetRefreshToken')) {
      return handleTokenRefresh(req);
    }

    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
        ...(idToken && { 'X-Id-Token': idToken })
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('Unauthorized, redirecting to login');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        userService.setUser(null);
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('Forbidden: Insufficient permissions');
        router.navigate(['/unauthorized']);
      }
      return throwError(() => error);
    })
  );
}