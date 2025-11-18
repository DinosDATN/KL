import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
  errors?: { [key: string]: string };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ❌ No longer need TOKEN_KEY - token is in HttpOnly cookie
  private readonly USER_KEY = 'auth_user';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // BehaviorSubject to track authentication state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private authInitialized = new BehaviorSubject<boolean>(false);

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public authInitialized$ = this.authInitialized.asObservable();

  constructor(private http: HttpClient) {
    // In SSR, mark as initialized immediately without checking auth
    if (typeof window === 'undefined') {
      this.authInitialized.next(true);
      return;
    }

    // In browser, delay initialization to ensure localStorage is ready after hydration
    setTimeout(() => {
      this.initializeAuthState();
    }, 0);
  }

  /**
   * Initialize authentication state from localStorage and verify with server
   */
  private initializeAuthState(): void {
    const user = this.getUserFromStorage();
    
    if (user) {
      // Verify session with server (HttpOnly cookie will be sent automatically)
      this.getProfile().subscribe({
        next: (response) => {
          if (environment.enableLogging) {
            console.log('[Auth] Session verified:', response.data.user.name);
          }
          this.currentUserSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
          this.authInitialized.next(true);
        },
        error: () => {
          if (environment.enableLogging) {
            console.warn('[Auth] Session expired, clearing data');
          }
          this.clearAuthData();
          this.authInitialized.next(true);
        }
      });
    } else {
      // No user data, mark as initialized
      this.authInitialized.next(true);
    }
  }

  /**
   * User registration
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`, 
      registerData,
      { withCredentials: true } // ✅ Important: Send/receive cookies
    ).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.data?.user) {
          // ✅ Only save user data, token is in HttpOnly cookie
          this.setUserData(response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * User login
   */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`, 
      loginData,
      { withCredentials: true } // ✅ Important: Send/receive cookies
    ).pipe(
      tap((response: AuthResponse) => {
        if (response.success && response.data?.user) {
          // ✅ Only save user data, token is in HttpOnly cookie
          this.setUserData(response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * User logout
   */
  logout(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/logout`, 
      {},
      { withCredentials: true } // ✅ Important: Send cookies
    ).pipe(
      tap(() => {
        this.clearAuthData();
      }),
      catchError((error) => {
        // Even if logout fails on server, clear local data
        this.clearAuthData();
        return throwError(error);
      })
    );
  }

  /**
   * Get current user profile from server
   */
  getProfile(): Observable<{ success: boolean; data: { user: User } }> {
    return this.http.get<{ success: boolean; data: { user: User } }>(
      `${this.apiUrl}/profile`,
      { withCredentials: true } // ✅ Important: Send cookies
    ).pipe(
      tap((response) => {
        if (response.success && response.data.user) {
          this.updateUserData(response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getUserFromStorage();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * @deprecated Token is now in HttpOnly cookie
   * Kept for backward compatibility but returns null
   */
  getToken(): string | null {
    if (environment.enableLogging) {
      console.warn('[Auth] getToken() is deprecated. Token is in HttpOnly cookie.');
    }
    return null;
  }

  /**
   * Set user data (for OAuth callback or login)
   * Token is already set in HttpOnly cookie by backend
   */
  setUserData(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    if (environment.enableLogging) {
      console.log('[Auth] User authenticated:', user.name);
    }
  }

  /**
   * Update user data (sync with server)
   */
  private updateUserData(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Clear all authentication data
   * Note: HttpOnly cookie will be cleared by backend on logout
   */
  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Clear profile data if ProfileService is available
    // Note: We use dynamic import to avoid circular dependency
    import('./profile.service').then(({ ProfileService }) => {
      // Get the ProfileService instance from the injector if available
      // This is a workaround to clear profile data without creating circular dependency
      try {
        const profileService = new ProfileService(this.http);
        profileService.clearProfile();
      } catch (error) {
        // Ignore error if ProfileService is not available
      }
    }).catch(() => {
      // Ignore error if profile.service cannot be imported
    });
  }

  /**
   * Get user from localStorage
   */
  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          this.clearAuthData();
          return null;
        }
      }
    }
    return null;
  }


  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    if (environment.enableLogging) {
      console.error('[Auth] Error:', error.status, error.message);
    }
    
    // If unauthorized, clear auth data
    if (error.status === 401) {
      this.clearAuthData();
    }

    // Extract user-friendly error message
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors) {
        const errors = error.error.errors;
        const errorMessages = Object.values(errors).filter(Boolean);
        if (errorMessages.length > 0) {
          errorMessage = errorMessages[0] as string;
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => ({
      ...error.error,
      message: errorMessage
    }));
  };
}
