import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Admin API Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
  error?: string;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

// Dashboard Statistics Interfaces
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalProblems: number;
  totalRevenue: number;
  recentActivity: ActivityItem[];
  userGrowth: GrowthData[];
  topCourses: CourseStats[];
  systemHealth: SystemHealth;
}

export interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user_name?: string;
}

export interface GrowthData {
  date: string;
  users: number;
  courses: number;
  revenue: number;
}

export interface CourseStats {
  id: number;
  title: string;
  students: number;
  rating: number;
  revenue: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
}

// User Management Interfaces
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'creator' | 'admin';
  is_active: boolean;
  is_online: boolean;
  subscription_status: 'free' | 'premium';
  created_at: string;
  last_seen_at?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  is_active?: boolean;
  subscription_status?: string;
  search?: string;
  sortBy?: string;
  registration_date?: string;
  last_activity?: string;
}

// Course Management Interfaces
export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  level: string;
  status: 'draft' | 'published' | 'archived';
  students: number;
  rating: number;
  instructor_name: string;
  created_at: string;
  is_deleted: boolean;
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  status?: string;
  level?: string;
  search?: string;
  sortBy?: string;
  instructor_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Dashboard APIs
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/dashboard/stats`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // User Management APIs
  getUsers(filters: UserFilters = {}): Observable<{ users: AdminUser[], pagination: PaginationInfo }> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof UserFilters];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<{ users: AdminUser[], pagination: PaginationInfo }>>(`${this.apiUrl}/users`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http.get<ApiResponse<AdminUser>>(`${this.apiUrl}/users/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  updateUserRole(userId: number, role: string): Observable<AdminUser> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/users/${userId}/role`, { role })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  toggleUserStatus(userId: number, isActive: boolean): Observable<AdminUser> {
    return this.http.patch<ApiResponse<AdminUser>>(`${this.apiUrl}/users/${userId}/status`, { is_active: isActive })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  getUserStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/users/statistics`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // Course Management APIs
  getCourses(filters: CourseFilters = {}): Observable<{ courses: AdminCourse[], pagination: PaginationInfo }> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof CourseFilters];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<{ courses: AdminCourse[], pagination: PaginationInfo }>>(`${this.apiUrl}/courses`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  getCourseById(id: number): Observable<AdminCourse> {
    return this.http.get<ApiResponse<AdminCourse>>(`${this.apiUrl}/courses/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  updateCourseStatus(courseId: number, status: string): Observable<AdminCourse> {
    return this.http.patch<ApiResponse<AdminCourse>>(`${this.apiUrl}/courses/${courseId}/status`, { status })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  deleteCourse(courseId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/courses/${courseId}`)
      .pipe(
        map(() => void 0),
        catchError(this.handleError)
      );
  }

  getCourseStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/courses/statistics`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // Problem Management APIs
  getProblems(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/problems`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  getProblemStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/problems/statistics`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // Contest Management APIs
  getContests(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/contests`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  getContestStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/contests/statistics`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // Analytics APIs
  getPlatformAnalytics(dateRange?: string): Observable<any> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('range', dateRange);
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/analytics/platform`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  getUserEngagementAnalytics(dateRange?: string): Observable<any> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('range', dateRange);
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/analytics/engagement`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  getRevenueReports(dateRange?: string): Observable<any> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('range', dateRange);
    }

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/analytics/revenue`, { params })
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  // Export APIs
  exportUsers(format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/users/export?format=${format}`, { 
      responseType: 'blob',
      observe: 'body'
    });
  }

  exportCourses(format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/courses/export?format=${format}`, { 
      responseType: 'blob',
      observe: 'body'
    });
  }

  // Error handling
  private handleError = (error: HttpErrorResponse) => {
    console.error('Admin API error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => ({
      ...error.error,
      message: errorMessage,
      status: error.status
    }));
  };
}