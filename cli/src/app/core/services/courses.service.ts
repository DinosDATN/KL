import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, timeout, retry, catchError } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Course, CourseCategory } from '../models/course.model';
import { CourseModule, CourseLesson, CourseReview } from '../models/course-module.model';
import { User } from '../models/user.model';

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

interface CourseDetails {
  course: Course;
  instructor: User & { qualifications: any[] };
  category: CourseCategory;
  modules: CourseModule[];
  lessons: CourseLesson[];
  relatedCourses: Course[];
  reviews: CourseReview[];
}

interface CourseFilters {
  page?: number;
  limit?: number;
  level?: string;
  category_id?: number;
  is_premium?: boolean;
  instructor_id?: number;
  search?: string;
  sortBy?: string;
  priceRange?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    if (environment.enableLogging) {
      console.log('CoursesService initialized with API URL:', this.apiUrl);
    }
  }

  // Get all courses with filters and pagination
  getAllCourses(filters: CourseFilters = {}): Observable<PaginatedResponse<Course>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.level) params = params.set('level', filters.level);
    if (filters.category_id) params = params.set('category_id', filters.category_id.toString());
    if (filters.is_premium !== undefined) params = params.set('is_premium', filters.is_premium.toString());
    if (filters.instructor_id) params = params.set('instructor_id', filters.instructor_id.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.priceRange) params = params.set('priceRange', filters.priceRange);

    return this.http.get<PaginatedResponse<Course>>(`${this.apiUrl}/courses`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        catchError(error => this.handleError(error, 'Failed to fetch courses'))
      );
  }

  // Get single course by ID
  getCourseById(id: number): Observable<Course> {
    return this.http.get<ApiResponse<Course>>(`${this.apiUrl}/courses/${id}`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch course'))
      );
  }

  // Get featured courses
  getFeaturedCourses(limit: number = 6): Observable<Course[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Course[]>>(`${this.apiUrl}/courses/featured`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch featured courses'))
      );
  }

  // Get course details with all related data
  getCourseDetails(id: number): Observable<CourseDetails> {
    return this.http.get<ApiResponse<CourseDetails>>(`${this.apiUrl}/courses/${id}/details`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch course details'))
      );
  }

  // Get course categories
  getCourseCategories(): Observable<CourseCategory[]> {
    return this.http.get<ApiResponse<CourseCategory[]>>(`${this.apiUrl}/courses/categories`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch course categories'))
      );
  }

  // Get instructors
  getInstructors(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/courses/instructors`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch instructors'))
      );
  }

  // Get course modules
  getCourseModules(courseId: number): Observable<CourseModule[]> {
    return this.http.get<ApiResponse<CourseModule[]>>(`${this.apiUrl}/courses/${courseId}/modules`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch course modules'))
      );
  }

  // Get course lessons
  getCourseLessons(courseId: number): Observable<CourseLesson[]> {
    return this.http.get<ApiResponse<CourseLesson[]>>(`${this.apiUrl}/courses/${courseId}/lessons`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch course lessons'))
      );
  }

  // Get single lesson
  getLessonById(lessonId: number): Observable<CourseLesson> {
    return this.http.get<ApiResponse<CourseLesson>>(`${this.apiUrl}/courses/lessons/${lessonId}`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch lesson'))
      );
  }

  // Get course reviews
  getCourseReviews(courseId: number): Observable<{ reviews: CourseReview[], average_rating: number, review_count: number }> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/courses/${courseId}/reviews`)
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        map(response => this.handleSuccessResponse(response)),
        catchError(error => this.handleError(error, 'Failed to fetch course reviews'))
      );
  }

  // Get courses by instructor
  getCoursesByInstructor(instructorId: number, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Course>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Course>>(`${this.apiUrl}/courses/instructor/${instructorId}`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        catchError(error => this.handleError(error, 'Failed to fetch instructor courses'))
      );
  }

  // Get courses by category
  getCoursesByCategory(categoryId: number, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Course>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Course>>(`${this.apiUrl}/courses/category/${categoryId}`, { params })
      .pipe(
        timeout(environment.apiTimeout),
        retry(2),
        catchError(error => this.handleError(error, 'Failed to fetch category courses'))
      );
  }

  // Private helper methods
  private handleSuccessResponse<T>(response: ApiResponse<T>): T {
    if (response.success && response.data !== undefined) {
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
      console.error('CoursesService Error:', error);
      console.error('Error Context:', context);
    }

    return throwError(() => new Error(errorMessage));
  }
}
