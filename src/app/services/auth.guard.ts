import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user_context.service';

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
    if (isAuthenticated /*&& userDetail.getUser()?.email == ""*/) {
      router.navigate(['/admin', { outlets: { main: ['dashboard'] } }]);
      return false;
    }
    else if(isAuthenticated /*&& userDetail && userDetail,g == 0*/){
        router.navigate(['/waiter'])
        return false;
    }
    return true;
  }
  // if(state.url.includes('/admin') && isAuthenticated /*&& userDetail &&userDetail.roleID == 0*/){
  //   router.navigate(['/waiter'])
  //   return false;
  // }
  if (!isAuthenticated && !(router.url === '/login')) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
