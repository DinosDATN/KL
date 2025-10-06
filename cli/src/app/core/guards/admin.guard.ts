import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    return this.authService.currentUser$.pipe(
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