import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user_context.service';
import { Roles } from './constants.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService) as AuthService;
  const router = inject(Router) as Router;
  const userDetail = inject(UserService) as UserService;

  //const userDetail: any = await authService.setUserRole();


  if(state.url == '/login' || state.url === '/'){
    router.navigate(['/login']);
  }
  var isAuthenticated = (await authService.isAuthenticated());
  if (state.url === '/login' || state.url === '/') {
    if (isAuthenticated && userDetail.getUser()?.roles?.find(x => x == Roles.Admin)) {
      router.navigate(['/admin', { outlets: { main: ['dashboard'] } }]);
      return false;
    }
    else if(isAuthenticated && userDetail.getUser()?.roles?.find(x => x == Roles.Waiter)){
        router.navigate(['/waiter'])
        return false;
    }
    return true;
  }
  if(state.url.includes('/admin') && isAuthenticated && userDetail.getUser()?.roles?.find(x => x == Roles.Admin)){
    return true;
  }
  else
  {
    router.navigate(['/login'])
    return false;
  }
    
  // if (!isAuthenticated && !(router.url === '/login')) {
  //   router.navigate(['/login']);
  //   return false;
  // }
  // return true;
};
