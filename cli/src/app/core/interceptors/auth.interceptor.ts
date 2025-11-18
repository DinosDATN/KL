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
    // ✅ Clone request with credentials to send cookies
    // No need to add Authorization header - cookie is sent automatically
    const authReq = req.clone({
      withCredentials: true // ✅ Important: Send HttpOnly cookies
    });

    // Handle the request and catch any errors
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401 && this.authService.isAuthenticated()) {
          // Token might be expired or invalid, logout user
          console.log('🔒 401 Unauthorized - logging out user');
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
}
