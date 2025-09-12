import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, timeout, retry, catchError } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Course } from '../models/course.model';
import { Document } from '../models/document.model';
import { Problem } from '../models/problem.model';
import { User } from '../models/user.model';
import { Testimonial } from '../models/course.model';

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface OverviewStats {
  totalUsers: number;
  totalCourses: number;
  totalDocuments: number;
  totalProblems: number;
  totalSubmissions: number;
  totalBadges: number;
  totalAchievements: number;
}

interface LeaderboardUser extends User {
  xp: number;
  level: number;
  rank?: number;
}

interface Achievement {
  id: number;
  title: string;
  description?: string;
  icon: string;
  category: 'learning' | 'teaching' | 'community' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

@Injectable({
  providedIn: 'root'
})
export class HomepageService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    if (environment.enableLogging) {
      console.log('HomepageService initialized with API URL:', this.apiUrl);
    }
  }

  // Get platform overview statistics
  getOverview(): Observable<OverviewStats> {
    return this.http.get<ApiResponse<OverviewStats>>(`${this.apiUrl}/homepage/overview`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch overview statistics'))
      );
  }

  // Get featured courses
  getFeaturedCourses(limit: number = 6): Observable<Course[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/homepage/courses/featured`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch featured courses'))
      );
  }

  // Get featured documents
  getFeaturedDocuments(limit: number = 6): Observable<Document[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Document[]>>(`${this.apiUrl}/homepage/documents/featured`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch featured documents'))
      );
  }

  // Get featured problems
  getFeaturedProblems(limit: number = 6): Observable<Problem[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Problem[]>>(`${this.apiUrl}/homepage/problems/featured`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch featured problems'))
      );
  }

  // Get leaderboard
  getLeaderboard(limit: number = 5): Observable<LeaderboardUser[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<LeaderboardUser[]>>(`${this.apiUrl}/homepage/leaderboard`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch leaderboard'))
      );
  }

  // Get testimonials
  getTestimonials(limit: number = 6): Observable<Testimonial[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Testimonial[]>>(`${this.apiUrl}/homepage/testimonials`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch testimonials'))
      );
  }

  // Get featured achievements
  getFeaturedAchievements(limit: number = 6): Observable<Achievement[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Achievement[]>>(`${this.apiUrl}/homepage/achievements/featured`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch featured achievements'))
      );
  }

  // Alternative endpoints for direct access (matching backend routes)
  getOverviewDirect(): Observable<OverviewStats> {
    return this.http.get<ApiResponse<OverviewStats>>(`${this.apiUrl}/overview`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch overview statistics'))
      );
  }

  getLeaderboardDirect(limit: number = 5): Observable<LeaderboardUser[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<LeaderboardUser[]>>(`${this.apiUrl}/leaderboard`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch leaderboard'))
      );
  }

  getTestimonialsDirect(limit: number = 6): Observable<Testimonial[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Testimonial[]>>(`${this.apiUrl}/testimonials`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch testimonials'))
      );
  }

  // Private helper methods
  private handleSuccessResponse<T>(response: ApiResponse<T>): T {
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Invalid API response format');
    }
  }

  private handleError(error: any, context: string): Observable<never> {
    let errorMessage = `${context}: `;
    
    if (error instanceof HttpErrorResponse) {
      // Server-side errors
      if (error.status === 0) {
        errorMessage += 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status >= 400 && error.status < 500) {
        errorMessage += error.error?.message || `Client error (${error.status})`;
      } else if (error.status >= 500) {
        errorMessage += error.error?.message || `Server error (${error.status})`;
      } else {
        errorMessage += error.message || 'Unknown HTTP error occurred';
      }
    } else if (error.name === 'TimeoutError') {
      errorMessage += 'Request timed out. Please try again.';
    } else {
      errorMessage += error.message || 'An unexpected error occurred';
    }

    if (environment.enableLogging) {
      console.error('HomepageService Error:', error);
      console.error('Error Context:', context);
    }

    return throwError(() => new Error(errorMessage));
  }
}
