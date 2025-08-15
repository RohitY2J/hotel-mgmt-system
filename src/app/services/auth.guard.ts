import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user_context.service';
import { Roles } from './constants.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService) as AuthService;
  const router = inject(Router) as Router;
  var isAuthenticated = (await authService.isAuthenticated());
  if (state.url === '/login' || state.url === '/') {
    if (isAuthenticated && authService.getUser()?.roles?.find(x => x == Roles.Admin)) {
      router.navigate(['/admin', { outlets: { main: ['dashboard'] } }]);
      return false;
    }
    else if(isAuthenticated && authService.getUser()?.roles?.find(x => x == Roles.Waiter)){
        router.navigate(['/waiter'])
        return false;
    }
    return true;
  }
  if(state.url.includes('/admin') && isAuthenticated && authService.getUser()?.roles?.find(x => x == Roles.Admin)){
    return true;
  }
  else if(state.url.includes('/admin') && authService.getUser()?.roles?.find(x => x == Roles.Waiter))
  {
    router.navigate(['/waiter'])
    return false;
  }
        
  if (!isAuthenticated && !(router.url === '/login')) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
