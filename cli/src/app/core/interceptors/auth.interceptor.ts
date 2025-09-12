import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token from the service
    const authToken = this.authService.getToken();
    
    // Clone the request and add the authorization header if token exists
    let authReq = req;
    if (authToken && this.shouldAddToken(req.url)) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
    }

    // Handle the request and catch any errors
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401 && this.authService.isAuthenticated()) {
          // Token might be expired or invalid, logout user
          this.authService.logout().subscribe({
            complete: () => {
              this.router.navigate(['/auth/login']);
            }
          });
        }

        // Handle 403 Forbidden errors
        if (error.status === 403) {
          console.warn('Access forbidden:', error.error?.message || 'Insufficient permissions');
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Determine if we should add the auth token to this request
   * Only add token to API requests, not to external URLs
   */
  private shouldAddToken(url: string): boolean {
    // Don't add token to auth endpoints (login/register)
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      return false;
    }
    
    // Add token to all other API requests
    return url.includes('/api/');
  }
}
