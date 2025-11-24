import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserProfile, UserStat } from '../models/user.model';

export interface ProfileData {
  user: User;
  profile: UserProfile;
  stats: UserStat;
  goals?: any[];
  achievements?: any[];
  activity_logs?: any[];
  enrollments?: any[];
  recent_submissions?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { [key: string]: string };
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface UpdateProfileDetailsRequest {
  bio?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  website_url?: string;
  github_url?: string;
  linkedin_url?: string;
}

export interface UpdateSettingsRequest {
  preferred_language?: string;
  theme_mode?: 'light' | 'dark' | 'system';
  layout?: 'compact' | 'expanded';
  notifications?: boolean;
  visibility_profile?: boolean;
  visibility_achievements?: boolean;
  visibility_progress?: boolean;
  visibility_activity?: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/users/profile`;

  // Subject to track profile state
  private profileDataSubject = new BehaviorSubject<ProfileData | null>(null);
  public profileData$ = this.profileDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current user's profile data
   */
  getProfile(): Observable<ProfileData> {
    return this.http.get<ApiResponse<ProfileData>>(`${this.apiUrl}/me`).pipe(
      map((response) => {
        if (response.success && response.data) {
          this.profileDataSubject.next(response.data);
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch profile');
      })
    );
  }

  /**
   * Update basic profile information (name, email)
   */
  updateProfile(
    data: UpdateProfileRequest
  ): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .put<ApiResponse<{ user: User }>>(`${this.apiUrl}/basic`, data)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Update the current profile data with new user info
            const currentProfile = this.profileDataSubject.value;
            if (currentProfile) {
              this.profileDataSubject.next({
                ...currentProfile,
                user: response.data.user,
              });
            }
          }
        })
      );
  }

  /**
   * Update extended profile details
   */
  updateProfileDetails(
    data: UpdateProfileDetailsRequest
  ): Observable<ApiResponse<{ profile: UserProfile }>> {
    return this.http
      .put<ApiResponse<{ profile: UserProfile }>>(
        `${this.apiUrl}/details`,
        data
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Update the current profile data
            const currentProfile = this.profileDataSubject.value;
            if (currentProfile) {
              this.profileDataSubject.next({
                ...currentProfile,
                profile: response.data.profile,
              });
            }
          }
        })
      );
  }

  /**
   * Update user settings
   */
  updateSettings(
    data: UpdateSettingsRequest
  ): Observable<ApiResponse<{ profile: UserProfile }>> {
    return this.http
      .put<ApiResponse<{ profile: UserProfile }>>(
        `${this.apiUrl}/settings`,
        data
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Update the current profile data
            const currentProfile = this.profileDataSubject.value;
            if (currentProfile) {
              this.profileDataSubject.next({
                ...currentProfile,
                profile: response.data.profile,
              });
            }
          }
        })
      );
  }

  /**
   * Upload user avatar
   */
  uploadAvatar(
    file: File
  ): Observable<ApiResponse<{ avatar_url: string; user: User }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http
      .post<ApiResponse<{ avatar_url: string; user: User }>>(
        `${this.apiUrl}/avatar`,
        formData
      )
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Update the current profile data with new avatar
            const currentProfile = this.profileDataSubject.value;
            if (currentProfile) {
              this.profileDataSubject.next({
                ...currentProfile,
                user: response.data.user,
              });
            }
          }
        })
      );
  }

  /**
   * Change user password
   */
  changePassword(data: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/password`, data);
  }

  /**
   * Request to become a content creator
   * @deprecated Use CreatorApplicationService.submitApplication() instead
   */
  becomeCreator(): Observable<ApiResponse<{ user: User }>> {
    // This method is deprecated - redirect to new creator application system
    return throwError(() => ({
      success: false,
      message: 'This method is deprecated. Please use the creator application form instead.',
      status: 410,
    }));
  }

  /**
   * Get current profile data from subject
   */
  getCurrentProfile(): ProfileData | null {
    return this.profileDataSubject.value;
  }

  /**
   * Clear profile data (used on logout)
   */
  clearProfile(): void {
    this.profileDataSubject.next(null);
  }

  /**
   * Check if profile data is available
   */
  hasProfileData(): boolean {
    return this.profileDataSubject.value !== null;
  }

  /**
   * Validate URL format
   */
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (basic)
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    // Basic formatting - can be enhanced based on country codes
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(profile: UserProfile): number {
    const fields = [
      'bio',
      'birthday',
      'gender',
      'phone',
      'address',
      'website_url',
      'github_url',
      'linkedin_url',
    ];

    const filledFields = fields.filter((field) => {
      const value = (profile as any)[field];
      return value && value.toString().trim().length > 0;
    });

    return Math.round((filledFields.length / fields.length) * 100);
  }

  /**
   * Get avatar URL with fallback
   */
  getAvatarUrl(user: User): string {
    if (user.avatar_url) {
      // If it's a relative URL, prepend the API base URL
      if (user.avatar_url.startsWith('/uploads/')) {
        return `${environment.apiUrl.replace('/api/v1', '')}${user.avatar_url}`;
      }
      return user.avatar_url;
    }

    // Fallback to a default avatar service
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&size=150&background=random`;
  }
}
