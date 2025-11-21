import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { CourseLesson } from '../models/course-module.model';

export interface AdminLesson extends CourseLesson {
  Module?: {
    id: number;
    title: string;
    position: number;
    course_id?: number;
    Course?: {
      id: number;
      title: string;
      instructor_id?: number;
      status?: string;
      Instructor?: {
        id: number;
        name: string;
        email: string;
        avatar_url?: string;
      };
    };
  };
}

export interface LessonFilters {
  page?: number;
  limit?: number;
  module_id?: number;
  course_id?: number;
  type?: 'document' | 'video' | 'exercise' | 'quiz';
  search?: string;
  sortBy?: string;
}

export interface LessonStats {
  totalLessons: number;
  lessonsByType: {
    document?: number;
    video?: number;
    exercise?: number;
    quiz?: number;
  };
  averageDuration: number;
  documentLessons: number;
  videoLessons: number;
  exerciseLessons: number;
  quizLessons: number;
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

@Injectable({
  providedIn: 'root'
})
export class AdminLessonService {
  private readonly apiUrl = `${environment.apiUrl}/admin/lessons`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get all lessons for admin with filters and pagination
   */
  getLessons(filters: LessonFilters = {}): Observable<PaginatedResponse<AdminLesson>> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof LessonFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<AdminLesson>>(this.apiUrl, { 
      params,
      withCredentials: true
    });
  }

  /**
   * Get a single lesson by ID
   */
  getLesson(id: number): Observable<ApiResponse<AdminLesson>> {
    return this.http.get<ApiResponse<AdminLesson>>(`${this.apiUrl}/${id}`, { 
      withCredentials: true
    });
  }

  /**
   * Create a new lesson
   */
  createLesson(lessonData: Partial<AdminLesson>): Observable<ApiResponse<AdminLesson>> {
    return this.http.post<ApiResponse<AdminLesson>>(this.apiUrl, lessonData, {
      withCredentials: true
    });
  }

  /**
   * Update a lesson
   */
  updateLesson(id: number, lessonData: Partial<AdminLesson>): Observable<ApiResponse<AdminLesson>> {
    return this.http.put<ApiResponse<AdminLesson>>(`${this.apiUrl}/${id}`, lessonData, {
      withCredentials: true
    });
  }

  /**
   * Delete a lesson
   */
  deleteLesson(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    });
  }

  /**
   * Get lesson statistics
   */
  getLessonStatistics(courseId?: number, moduleId?: number): Observable<ApiResponse<LessonStats>> {
    let params = new HttpParams();
    if (courseId) {
      params = params.set('course_id', courseId.toString());
    }
    if (moduleId) {
      params = params.set('module_id', moduleId.toString());
    }

    return this.http.get<ApiResponse<LessonStats>>(`${this.apiUrl}/statistics`, {
      params,
      withCredentials: true
    });
  }

  /**
   * Bulk delete lessons
   */
  bulkDeleteLessons(lessonIds: number[]): Observable<ApiResponse<{ deletedCount: number }>> {
    return this.http.post<ApiResponse<{ deletedCount: number }>>(`${this.apiUrl}/bulk/delete`, {
      lesson_ids: lessonIds
    }, {
      withCredentials: true
    });
  }
}

