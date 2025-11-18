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
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // BehaviorSubject to track authentication state
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize authentication state from storage
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeAuthState(): void {
    const token = this.getToken();
    const user = this.getUserFromStorage();
    
    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuthData();
    }
  }

  /**
   * User registration
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        tap((response: AuthResponse) => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * User login
   */
  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap((response: AuthResponse) => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * User logout
   */
  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/logout`, {})
      .pipe(
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
    return this.http.get<{ success: boolean; data: { user: User } }>(`${this.apiUrl}/profile`)
      .pipe(
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
    const token = this.getToken();
    return !!(token && !this.isTokenExpired(token) && this.getUserFromStorage());
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Set authentication data (token and user)
   */
  private setAuthData(token: string, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Update user data
   */
  private updateUserData(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
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
   * Check if token exists and is not expired
   */
  private hasValidToken(): boolean {
    const token = this.getToken();
    return !!(token && !this.isTokenExpired(token));
  }

  /**
   * Check if JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }


  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('Authentication error:', error);
    
    // If unauthorized, clear auth data
    if (error.status === 401) {
      this.clearAuthData();
    }

    // Return user-friendly error
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.errors) {
        // Handle validation errors
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
