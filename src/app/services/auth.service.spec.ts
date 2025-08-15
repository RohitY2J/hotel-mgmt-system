import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpService } from './http-service.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockHttpService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockHttpService = {
      httpPost: jasmine.createSpy('httpPost').and.returnValue(of({})),
      httpGet: jasmine.createSpy('httpGet').and.returnValue(of({}))
    };
    mockRouter = { navigateByUrl: jasmine.createSpy('navigateByUrl') };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: Router, useValue: mockRouter }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // describe('login', () => {
  //   it('should call httpPost with "login" and navigate to /admin/dashboard on success', () => {
  //     const loginRequest = { username: 'test', password: 'test' };
  //     service.login(loginRequest);
  //     expect(mockHttpService.httpPost).toHaveBeenCalledWith('login', loginRequest);
  //     expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  //   });
  // });

  describe('logout', () => {
    it('should call httpGet with "logout" and navigate to /login on success', () => {
      service.logout();
      expect(mockHttpService.httpGet).toHaveBeenCalledWith('logout');
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });

  describe('isAuthenticated', () => {
    it('should resolve to true if isAuthenticated is true', async () => {
      mockHttpService.httpGet.and.returnValue(of({ isAuthenticated: true }));
      const result = await service.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should reject with false on error', async () => {
      mockHttpService.httpGet.and.returnValue(throwError('error'));
      try {
        await service.isAuthenticated();
      } catch (e) {
        expect(e).toBe(false);
      }
    });
  });

  describe('setUserRole', () => {
    it('should set userDetails and localStorage on success', async () => {
      const userDetails = { client: { clientName: 'testClient' } };
      mockHttpService.httpGet.and.returnValue(of(userDetails));
      spyOn(localStorage, 'setItem');
      await service.setUserRole();
      //expect(service.getUser()).toEqual(userDetails);
      expect(localStorage.setItem).toHaveBeenCalledWith('clientName', 'testClient');
    });

    it('should reject with {} on error', async () => {
      mockHttpService.httpGet.and.returnValue(throwError('error'));
      try {
        await service.setUserRole();
      } catch (e) {
        expect(e).toEqual({});
      }
    });
  });

  describe('getUserDetails', () => {
    it('should call httpGet with "getUserDetails"', () => {
      //service.getUserDetails().subscribe();
      expect(mockHttpService.httpGet).toHaveBeenCalledWith('getUserDetails');
    });
  });
});