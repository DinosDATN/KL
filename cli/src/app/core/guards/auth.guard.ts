import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take, filter, switchMap, timeout, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (!isPlatformBrowser(this.platformId)) {
      return true; // SSR: allow rendering, auth checked on client
    }
    
    return this.authService.authInitialized$.pipe(
      filter(initialized => initialized === true),
      take(1),
      timeout(5000),
      catchError(() => {
        if (environment.enableLogging) {
          console.warn('[AuthGuard] Timeout, redirecting to login');
        }
        return of(false);
      }),
      switchMap(() => this.authService.isAuthenticated$),
      take(1),
      map((isAuthenticated: boolean) => {
        if (isAuthenticated) {
          return true;
        }
        this.router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (!isPlatformBrowser(this.platformId)) {
      return true; // SSR: allow rendering, auth checked on client
    }
    
    return this.authService.authInitialized$.pipe(
      filter(initialized => initialized === true),
      take(1),
      timeout(5000),
      catchError(() => {
        if (environment.enableLogging) {
          console.warn('[NoAuthGuard] Timeout');
        }
        return of(false);
      }),
      switchMap(() => this.authService.isAuthenticated$),
      take(1),
      map((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          return true;
        }
        this.router.navigate(['/']);
        return false;
      })
    );
  }
}
