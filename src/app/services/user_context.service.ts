import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserInfo {
  userId: string | null;
  email: string | null;
  roles: string[] | null;
  clientApplicationId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject = new BehaviorSubject<UserInfo | null>(null);
  user$: Observable<UserInfo | null> = this.userSubject.asObservable();

  setUser(user: UserInfo | null): void {
    this.userSubject.next(user);
  }

  getUser(): UserInfo | null {
    return this.userSubject.getValue();
  }
}