import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take, filter, switchMap, timeout, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

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
    
    if (!isPlatformBrowser(this.platformId)) {
      return true; // SSR: allow rendering, auth checked on client
    }
    
    return this.authService.authInitialized$.pipe(
      filter(initialized => initialized === true),
      take(1),
      timeout(5000),
      catchError(() => {
        if (environment.enableLogging) {
          console.warn('[AdminGuard] Timeout, redirecting to login');
        }
        return of(null);
      }),
      switchMap(() => this.authService.currentUser$),
      take(1),
      map((user) => {
        if (user && user.role === 'admin') {
          return true;
        }
        if (user && user.role !== 'admin') {
          this.router.navigate(['/']);
          return false;
        }
        this.router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}