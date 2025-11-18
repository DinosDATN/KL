import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take, filter, switchMap, timeout, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

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
    
    // ✅ In SSR, allow rendering (auth will be checked on client side)
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }
    
    // ✅ Wait for auth to be initialized before checking authentication
    return this.authService.authInitialized$.pipe(
      filter(initialized => initialized === true), // Wait until initialized
      take(1),
      timeout(5000), // Timeout after 5 seconds to prevent hanging
      catchError(() => {
        // If timeout or error, treat as not authenticated
        console.warn('Auth initialization timeout, redirecting to login');
        return of(false);
      }),
      switchMap(() => this.authService.isAuthenticated$),
      take(1),
      map((isAuthenticated: boolean) => {
        if (isAuthenticated) {
          return true;
        } else {
          // Store the attempted URL for redirecting after login
          const redirectUrl = state.url;
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: redirectUrl }
          });
          return false;
        }
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
    
    // ✅ In SSR, allow rendering (auth will be checked on client side)
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }
    
    // ✅ Wait for auth to be initialized before checking authentication
    return this.authService.authInitialized$.pipe(
      filter(initialized => initialized === true), // Wait until initialized
      take(1),
      timeout(5000), // Timeout after 5 seconds to prevent hanging
      catchError(() => {
        // If timeout or error, treat as not authenticated
        console.warn('Auth initialization timeout in NoAuthGuard');
        return of(false);
      }),
      switchMap(() => this.authService.isAuthenticated$),
      take(1),
      map((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          return true;
        } else {
          // User is already authenticated, redirect to home
          this.router.navigate(['/']);
          return false;
        }
      })
    );
  }
}
