import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService) as AuthService;
  const router = inject(Router) as Router;

  var isAuthenticated = (await authService.isAuthenticated());
  if (state.url === '/login' || state.url === '/') {
    if (isAuthenticated) {
      router.navigate(['/admin', { outlets: { main: ['dashboard'] } }]);
      return false;
    }
    return true;
  }
  if (!isAuthenticated && !(router.url === '/login')) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
