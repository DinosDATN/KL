import { Injectable, OnDestroy } from '@angular/core';
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
export class AuthService implements OnDestroy {
  private readonly USER_KEY = 'auth_user';
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly VERIFICATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // BehaviorSubject to track authentication state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private authInitialized = new BehaviorSubject<boolean>(false);

  // Periodic verification
  private verificationTimer?: any;
  private isVerifying = false;

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public authInitialized$ = this.authInitialized.asObservable();

  constructor(private http: HttpClient) {
    if (environment.enableLogging) {
      console.log('[Auth] AuthService constructor called', {
        hasWindow: typeof window !== 'undefined',
        hasLocalStorage: typeof localStorage !== 'undefined',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
      });
    }
    
    // ✅ Immediate check for SSR vs Browser
    if (typeof window === 'undefined') {
      // SSR mode - mark as initialized immediately with no user
      if (environment.enableLogging) {
        console.log('[Auth] SSR mode detected, marking as initialized with no user');
      }
      this.authInitialized.next(true);
      return;
    }

    // ✅ Browser mode - wait for hydration then initialize
    setTimeout(() => {
      if (environment.enableLogging) {
        console.log('[Auth] Browser mode - initializing auth state');
      }
      this.initializeAuthState();
      this.startPeriodicVerification();
    }, 50); // Minimal delay for hydration
  }

  /**
   * Initialize authentication state from localStorage and verify with server
   * ✅ This ensures currentUser is loaded from localStorage BEFORE subscriptions run
   */
  private initializeAuthState(): void {
    const user = this.getUserFromStorage();
    
    if (environment.enableLogging) {
      console.log('[Auth] Initializing auth state:', {
        hasUserInStorage: !!user,
        userName: user?.name
      });
    }
    
    if (user) {
      // ✅ Set user immediately from localStorage to prevent flicker
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      
      // Then verify session with server (HttpOnly cookie will be sent automatically)
      this.getProfile().subscribe({
        next: (response) => {
          if (environment.enableLogging) {
            console.log('[Auth] Session verified, updating currentUser$:', response.data.user.name);
          }
          // Update with fresh data from server
          this.currentUserSubject.next(response.data.user);
          this.isAuthenticatedSubject.next(true);
          this.authInitialized.next(true);
        },
        error: () => {
          if (environment.enableLogging) {
            console.warn('[Auth] Session expired, clearing data and setting currentUser$ to null');
          }
          this.clearAuthData();
          this.authInitialized.next(true);
        }
      });
    } else {
      // No user data, mark as initialized
      if (environment.enableLogging) {
        console.log('[Auth] No user in storage, setting currentUser$ to null and marking as initialized');
      }
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.authInitialized.next(true);
    }
  }

  /**
   * Start periodic session verification
   * Verifies session every 5 minutes to detect cookie expiration
   */
  private startPeriodicVerification(): void {
    // Clear any existing timer
    this.stopPeriodicVerification();

    // Start new timer
    this.verificationTimer = setInterval(() => {
      this.verifySession();
    }, this.VERIFICATION_INTERVAL);

    if (environment.enableLogging) {
      console.log('[Auth] Periodic verification started (every 5 minutes)');
    }
  }

  /**
   * Stop periodic session verification
   */
  private stopPeriodicVerification(): void {
    if (this.verificationTimer) {
      clearInterval(this.verificationTimer);
      this.verificationTimer = undefined;
      
      if (environment.enableLogging) {
        console.log('[Auth] Periodic verification stopped');
      }
    }
  }

  /**
   * Verify current session with server
   */
  private verifySession(): void {
    // Skip if not authenticated or already verifying
    if (!this.isAuthenticatedSubject.value || this.isVerifying) {
      return;
    }

    this.isVerifying = true;

    this.getProfile().subscribe({
      next: (response) => {
        // Update user data if changed
        const currentUser = this.currentUserSubject.value;
        const newUser = response.data.user;
        
        if (JSON.stringify(currentUser) !== JSON.stringify(newUser)) {
          if (environment.enableLogging) {
            console.log('[Auth] User data updated from server');
          }
          this.updateUserData(newUser);
        }
        
        this.isVerifying = false;
      },
      error: (error) => {
        this.isVerifying = false;
        
        // If 401, session expired - logout user
        if (error.status === 401) {
          if (environment.enableLogging) {
            console.warn('[Auth] Session expired during verification, logging out');
          }
          this.clearAuthData();
          this.stopPeriodicVerification();
        }
      }
    });
  }

  /**
   * Manually trigger session verification
   * Useful for checking session after user action
   */
  public checkSession(): Observable<boolean> {
    return new Observable(observer => {
      if (!this.isAuthenticatedSubject.value) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.getProfile().subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: () => {
          this.clearAuthData();
          observer.next(false);
          observer.complete();
        }
      });
    });
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
    
    // Start periodic verification when user logs in
    if (typeof window !== 'undefined') {
      this.startPeriodicVerification();
    }
    
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
    // Stop periodic verification
    this.stopPeriodicVerification();
    
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
   * Cleanup when service is destroyed
   */
  ngOnDestroy(): void {
    this.stopPeriodicVerification();
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
