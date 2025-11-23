import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AdminCourse, CourseFilters, CourseStats, AdminCourseService, ApiResponse, PaginatedResponse } from './admin-course.service';
import { AuthService } from './auth.service';

export interface CreatorCourse extends AdminCourse {}

export interface CreatorCourseStats {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  archived_courses: number;
  total_students: number;
  total_enrollments: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
}

@Injectable({
  providedIn: 'root'
})
export class CreatorCourseService {
  private readonly apiUrl = `${environment.apiUrl}/admin/courses`;

  constructor(
    private http: HttpClient,
    private adminCourseService: AdminCourseService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get all courses created by the current creator
   */
  getMyCourses(filters: CourseFilters = {}): Observable<PaginatedResponse<CreatorCourse>> {
    // Get current user to filter by instructor_id
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return of({
        success: false,
        data: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_items: 0,
          items_per_page: filters.limit || 10
        }
      });
    }

    // Filter by current user's instructor_id
    const filtersWithInstructor = {
      ...filters,
      instructor_id: currentUser.id
    };

    return this.adminCourseService.getCourses(filtersWithInstructor).pipe(
      map(response => ({
        ...response,
        data: response.data.filter(course => !course.is_deleted)
      })),
      catchError(error => {
        console.error('Error fetching creator courses:', error);
        return of({
          success: false,
          data: [],
          pagination: {
            current_page: 1,
            total_pages: 0,
            total_items: 0,
            items_per_page: filters.limit || 10
          }
        });
      })
    );
  }

  /**
   * Get a single course by ID (only if creator owns it)
   */
  getMyCourse(id: number): Observable<ApiResponse<CreatorCourse>> {
    return this.adminCourseService.getCourse(id).pipe(
      map(response => {
        const currentUser = this.authService.getCurrentUser();
        if (response.success && response.data) {
          // Verify ownership
          if (response.data.instructor_id !== currentUser?.id && currentUser?.role !== 'admin') {
            return {
              success: false,
              message: 'You do not have permission to access this course',
              error: 'Unauthorized'
            };
          }
        }
        return response;
      })
    );
  }

  /**
   * Create a new course
   */
  createCourse(courseData: Partial<CreatorCourse>): Observable<ApiResponse<CreatorCourse>> {
    // Ensure instructor_id is set to current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      courseData.instructor_id = currentUser.id;
    }

    return this.adminCourseService.createCourse(courseData);
  }

  /**
   * Update a course (only if creator owns it)
   */
  updateCourse(id: number, courseData: Partial<CreatorCourse>): Observable<ApiResponse<CreatorCourse>> {
    // Verify ownership before updating
    return this.getMyCourse(id).pipe(
      switchMap(response => {
        if (!response.success || !response.data) {
          return of({
            success: false,
            message: response.message || 'You do not have permission to update this course'
          } as ApiResponse<CreatorCourse>);
        }
        // Remove instructor_id from update data to prevent changing owner
        const { instructor_id, ...updateData } = courseData;
        return this.adminCourseService.updateCourse(id, updateData);
      }),
      catchError(error => {
        return of({
          success: false,
          message: error.message || 'You do not have permission to update this course'
        } as ApiResponse<CreatorCourse>);
      })
    );
  }

  /**
   * Update course using admin service directly (after ownership verification)
   */
  updateCourseDirect(id: number, courseData: Partial<CreatorCourse>): Observable<ApiResponse<CreatorCourse>> {
    // Remove instructor_id from update data to prevent changing owner
    const { instructor_id, ...updateData } = courseData;
    return this.adminCourseService.updateCourse(id, updateData);
  }

  /**
   * Delete a course (soft delete)
   */
  deleteCourse(id: number): Observable<ApiResponse<void>> {
    // Verify ownership before deleting
    return this.getMyCourse(id).pipe(
      switchMap(response => {
        if (!response.success || !response.data) {
          return of({
            success: false,
            message: response.message || 'You do not have permission to delete this course'
          } as ApiResponse<void>);
        }
        return this.adminCourseService.deleteCourse(id);
      }),
      catchError(error => {
        return of({
          success: false,
          message: error.message || 'You do not have permission to delete this course'
        } as ApiResponse<void>);
      })
    );
  }

  /**
   * Delete course using admin service directly (after ownership verification)
   */
  deleteCourseDirect(id: number): Observable<ApiResponse<void>> {
    return this.adminCourseService.deleteCourse(id);
  }

  /**
   * Update course status
   */
  updateCourseStatus(id: number, status: 'draft' | 'published' | 'archived'): Observable<ApiResponse<CreatorCourse>> {
    // Verify ownership before updating status
    return this.getMyCourse(id).pipe(
      switchMap(response => {
        if (!response.success || !response.data) {
          return of({
            success: false,
            message: response.message || 'You do not have permission to update this course status'
          } as ApiResponse<CreatorCourse>);
        }
        return this.adminCourseService.updateCourseStatus(id, status);
      }),
      catchError(error => {
        return of({
          success: false,
          message: error.message || 'You do not have permission to update this course status'
        } as ApiResponse<CreatorCourse>);
      })
    );
  }

  /**
   * Update course status using admin service directly (after ownership verification)
   */
  updateCourseStatusDirect(id: number, status: 'draft' | 'published' | 'archived'): Observable<ApiResponse<CreatorCourse>> {
    return this.adminCourseService.updateCourseStatus(id, status);
  }

  /**
   * Get creator course statistics
   */
  getCreatorCourseStatistics(): Observable<CreatorCourseStats> {
    return this.getMyCourses({ limit: 1000 }).pipe(
      map(response => {
        const courses = response.data;
        const publishedCourses = courses.filter(c => c.status === 'published');
        const draftCourses = courses.filter(c => c.status === 'draft');
        const archivedCourses = courses.filter(c => c.status === 'archived');

        const totalStudents = publishedCourses.reduce((sum, c) => sum + (c.students || 0), 0);
        const totalEnrollments = publishedCourses.reduce((sum, c) => sum + (c.students || 0), 0);
        const totalRevenue = publishedCourses.reduce((sum, c) => {
          const courseRevenue = (c.price || 0) * (c.students || 0);
          return sum + courseRevenue;
        }, 0);

        const ratings = publishedCourses
          .filter(c => c.rating && c.rating > 0)
          .map(c => c.rating);
        const averageRating = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

        return {
          total_courses: courses.length,
          published_courses: publishedCourses.length,
          draft_courses: draftCourses.length,
          archived_courses: archivedCourses.length,
          total_students: totalStudents,
          total_enrollments: totalEnrollments,
          total_revenue: totalRevenue,
          average_rating: Math.round(averageRating * 10) / 10,
          total_reviews: 0 // Can be fetched from reviews API if needed
        };
      }),
      catchError(error => {
        console.error('Error fetching creator course statistics:', error);
        return of({
          total_courses: 0,
          published_courses: 0,
          draft_courses: 0,
          archived_courses: 0,
          total_students: 0,
          total_enrollments: 0,
          total_revenue: 0,
          average_rating: 0,
          total_reviews: 0
        });
      })
    );
  }

  /**
   * Upload course thumbnail
   */
  uploadThumbnail(file: File): Observable<ApiResponse<{ file_url: string; file_name: string; file_size: number; type: string }>> {
    return this.adminCourseService.uploadThumbnail(file);
  }

  /**
   * Upload lesson video
   */
  uploadVideo(file: File): Observable<ApiResponse<{ file_url: string; file_name: string; file_size: number; type: string }>> {
    return this.adminCourseService.uploadVideo(file);
  }

  /**
   * Get course students (enrolled users)
   */
  getCourseStudents(
    courseId: number,
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = ''
  ): Observable<PaginatedResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any>(
      `${environment.apiUrl}/course-content/courses/${courseId}/students`,
      { params, withCredentials: true }
    ).pipe(
      map((response: any) => {
        if (response.success) {
          return {
            success: true,
            data: response.data || [],
            pagination: response.pagination || {
              current_page: page,
              total_pages: 1,
              total_items: 0,
              items_per_page: limit
            }
          };
        }
        throw new Error(response.message || 'Failed to fetch course students');
      }),
      catchError(error => {
        console.error('Error fetching course students:', error);
        return of({
          success: false,
          data: [],
          pagination: {
            current_page: page,
            total_pages: 0,
            total_items: 0,
            items_per_page: limit
          }
        });
      })
    );
  }
}
