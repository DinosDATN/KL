import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take, filter, switchMap, timeout, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

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
    
    // ✅ Wait for auth to be initialized before checking user role
    return this.authService.authInitialized$.pipe(
      filter(initialized => initialized === true), // Wait until initialized
      take(1),
      timeout(5000), // Timeout after 5 seconds to prevent hanging
      catchError(() => {
        // If timeout or error, treat as not authenticated
        console.warn('Auth initialization timeout in AdminGuard, redirecting to login');
        return of(null);
      }),
      switchMap(() => this.authService.currentUser$),
      take(1),
      map((user) => {
        // Check if user is authenticated and has admin role
        if (user && user.role === 'admin') {
          return true;
        } else if (user && user.role !== 'admin') {
          // User is authenticated but not admin, redirect to main site
          this.router.navigate(['/']);
          return false;
        } else {
          // User is not authenticated, redirect to login
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      })
    );
  }
}