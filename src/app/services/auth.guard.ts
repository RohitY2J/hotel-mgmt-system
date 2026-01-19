import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user_context.service';
import { Roles } from './constants.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService) as AuthService;
  const router = inject(Router) as Router;
  var isAuthenticated = (await authService.isAuthenticated());
  
  const roles = authService.getUser()?.roles || [];
  
  if (state.url === '/login' || state.url === '/') {
  if (isAuthenticated && roles.includes(Roles.Admin)) {
      router.navigate(['/admin', { outlets: { main: ['dashboard'] } }]);
      return false;
    }
    else if(isAuthenticated && roles.includes(Roles.Waiter)){
        router.navigate(['/waiter'])
        return false;
    }
    return true;
  }
  else if (!isAuthenticated && !(router.url === '/login')) {
    router.navigate(['/login']);
    return false;
  }

  if(state.url.includes('/admin'))
  {
    if(authService.getUser()?.roles?.find(x => x == Roles.Admin)){
      return true;
    }
    else if(authService.getUser()?.roles?.find(x => x == Roles.Waiter)){
      router.navigate(['/waiter']);
      return false;
    }
    else if(!authService.getUser()?.roles?.find(x => x == Roles.Admin)){
      console.log('No roles assigned to your user. Please contact administrator.');
      authService.logout('No roles assigned to your user. Please contact administrator.');
      return false;
    }
  }
 
  return true;
};
