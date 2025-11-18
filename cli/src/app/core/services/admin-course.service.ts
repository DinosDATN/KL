import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface AdminCourse {
  id: number;
  title: string;
  description?: string;
  category_id: number;
  instructor_id: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: number;
  price?: number;
  original_price?: number;
  discount?: number;
  is_premium: boolean;
  status: 'draft' | 'published' | 'archived';
  thumbnail?: string;
  is_deleted: boolean;
  students: number;
  rating: number;
  revenue: number;
  created_at: string;
  updated_at: string;
  Instructor?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  Category?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  status?: string;
  category_id?: number;
  instructor_id?: number;
  level?: string;
  is_premium?: boolean;
  is_deleted?: boolean;
  search?: string;
  sortBy?: string;
  priceRange?: string;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
  deletedCourses: number;
  premiumCourses: number;
  freeCourses: number;
  totalRevenue: number;
  totalStudents: number;
  averageRating: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface BulkActionRequest {
  course_ids: number[];
  update_data?: any;
  permanent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminCourseService {
  private readonly apiUrl = `${environment.apiUrl}/admin/courses`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get all courses for admin with filters and pagination
   */
  getCourses(filters: CourseFilters = {}): Observable<PaginatedResponse<AdminCourse>> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof CourseFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<AdminCourse>>(this.apiUrl, { 
      params,
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Get a single course by ID
   */
  getCourse(id: number, includeDeleted: boolean = false): Observable<ApiResponse<AdminCourse>> {
    let params = new HttpParams();
    if (includeDeleted) {
      params = params.set('include_deleted', 'true');
    }

    return this.http.get<ApiResponse<AdminCourse>>(`${this.apiUrl}/${id}`, { 
      params,
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Create a new course
   */
  createCourse(courseData: Partial<AdminCourse>): Observable<ApiResponse<AdminCourse>> {
    return this.http.post<ApiResponse<AdminCourse>>(this.apiUrl, courseData, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Update a course
   */
  updateCourse(id: number, courseData: Partial<AdminCourse>): Observable<ApiResponse<AdminCourse>> {
    return this.http.put<ApiResponse<AdminCourse>>(`${this.apiUrl}/${id}`, courseData, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Delete a course (soft delete)
   */
  deleteCourse(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Permanently delete a course
   */
  permanentlyDeleteCourse(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}/permanent`, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Restore a deleted course
   */
  restoreCourse(id: number): Observable<ApiResponse<AdminCourse>> {
    return this.http.post<ApiResponse<AdminCourse>>(`${this.apiUrl}/${id}/restore`, {}, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Update course status
   */
  updateCourseStatus(id: number, status: string): Observable<ApiResponse<AdminCourse>> {
    return this.http.patch<ApiResponse<AdminCourse>>(`${this.apiUrl}/${id}/status`, { status }, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Get course statistics
   */
  getCourseStatistics(): Observable<ApiResponse<CourseStats>> {
    return this.http.get<ApiResponse<CourseStats>>(`${this.apiUrl}/statistics`, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Get deleted courses
   */
  getDeletedCourses(filters: CourseFilters = {}): Observable<PaginatedResponse<AdminCourse>> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof CourseFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<AdminCourse>>(`${this.apiUrl}/deleted`, { 
      params,
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Bulk update courses
   */
  bulkUpdateCourses(courseIds: number[], updateData: any): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/bulk/update`, {
      course_ids: courseIds,
      update_data: updateData
    }, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Bulk delete courses
   */
  bulkDeleteCourses(courseIds: number[], permanent: boolean = false): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bulk/delete`, {
      course_ids: courseIds,
      permanent
    }, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Bulk restore courses
   */
  bulkRestoreCourses(courseIds: number[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bulk/restore`, {
      course_ids: courseIds
    }, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Export courses
   */
  exportCourses(format: 'json' | 'csv' = 'json', includeDeleted: boolean = false): Observable<Blob> {
    let params = new HttpParams()
      .set('format', format);
    
    if (includeDeleted) {
      params = params.set('include_deleted', 'true');
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Download export file
   */
  downloadExport(blob: Blob, filename: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('File download is not available during server-side rendering');
      return;
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}