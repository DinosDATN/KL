import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProfileService, ApiResponse } from './profile.service';
import { Course } from '../models/course.model';

export interface CreatorStatistics {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  total_students: number;
  total_enrollments: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
  courses_by_status: {
    published: number;
    draft: number;
    archived: number;
  };
  recent_enrollments: number;
}

export interface CreatorProfileData {
  user: any;
  profile: any;
  stats: any;
  creator_statistics: CreatorStatistics;
  courses: Course[];
}

@Injectable({
  providedIn: 'root',
})
export class CreatorProfileService {
  private readonly apiUrl = `${environment.apiUrl}/users/profile`;
  private readonly adminApiUrl = `${environment.apiUrl}/admin/courses`;

  constructor(
    private http: HttpClient,
    private profileService: ProfileService
  ) {}

  /**
   * Get creator profile with statistics
   */
  getCreatorProfile(): Observable<CreatorProfileData> {
    return this.profileService.getProfile().pipe(
      map((profileData) => {
        // We'll fetch creator statistics separately
        return {
          ...profileData,
          creator_statistics: {
            total_courses: 0,
            published_courses: 0,
            draft_courses: 0,
            total_students: 0,
            total_enrollments: 0,
            total_revenue: 0,
            average_rating: 0,
            total_reviews: 0,
            courses_by_status: {
              published: 0,
              draft: 0,
              archived: 0,
            },
            recent_enrollments: 0,
          },
          courses: [],
        } as CreatorProfileData;
      })
    );
  }

  /**
   * Get creator statistics
   */
  getCreatorStatistics(): Observable<CreatorStatistics> {
    // Get courses created by current user
    const params = new HttpParams().set('limit', '1000');
    return this.http
      .get<ApiResponse<any>>(`${this.adminApiUrl}`, { params })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            const courses = Array.isArray(response.data)
              ? response.data
              : response.data.courses || response.data || [];

            const publishedCourses = courses.filter(
              (c: any) => c.status === 'published' && !c.is_deleted
            );
            const draftCourses = courses.filter(
              (c: any) => c.status === 'draft' && !c.is_deleted
            );
            const archivedCourses = courses.filter(
              (c: any) => c.status === 'archived' && !c.is_deleted
            );

            // Calculate statistics
            const totalStudents = publishedCourses.reduce(
              (sum: number, c: any) => sum + (c.students || 0),
              0
            );
            const totalEnrollments = publishedCourses.reduce(
              (sum: number, c: any) => sum + (c.enrollments_count || 0),
              0
            );
            const totalRevenue = publishedCourses.reduce(
              (sum: number, c: any) => {
                const courseRevenue = (c.price || 0) * (c.students || 0);
                return sum + courseRevenue;
              },
              0
            );

            const ratings = publishedCourses
              .filter((c: any) => c.rating && c.rating > 0)
              .map((c: any) => c.rating);
            const averageRating =
              ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) /
                  ratings.length
                : 0;

            const totalReviews = publishedCourses.reduce(
              (sum: number, c: any) => sum + (c.reviews_count || 0),
              0
            );

            return {
              total_courses: courses.filter((c: any) => !c.is_deleted).length,
              published_courses: publishedCourses.length,
              draft_courses: draftCourses.length,
              total_students: totalStudents,
              total_enrollments: totalEnrollments,
              total_revenue: totalRevenue,
              average_rating: Math.round(averageRating * 10) / 10,
              total_reviews: totalReviews,
              courses_by_status: {
                published: publishedCourses.length,
                draft: draftCourses.length,
                archived: archivedCourses.length,
              },
              recent_enrollments: 0, // Can be calculated from enrollment data
            };
          }
          throw new Error('Failed to fetch creator statistics');
        }),
        catchError((error) => {
          console.error('Error fetching creator statistics:', error);
          // Return default statistics on error
          return of({
            total_courses: 0,
            published_courses: 0,
            draft_courses: 0,
            total_students: 0,
            total_enrollments: 0,
            total_revenue: 0,
            average_rating: 0,
            total_reviews: 0,
            courses_by_status: {
              published: 0,
              draft: 0,
              archived: 0,
            },
            recent_enrollments: 0,
          });
        })
      );
  }

  /**
   * Get courses created by current creator
   */
  getCreatorCourses(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Observable<{ courses: Course[]; pagination: any }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http
      .get<ApiResponse<any>>(`${this.adminApiUrl}`, { params })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            const courses = Array.isArray(response.data)
              ? response.data
              : response.data.courses || [];
            const pagination = response.data.pagination || {
              current_page: page,
              total_pages: 1,
              total_items: courses.length,
              items_per_page: limit,
            };

            return {
              courses: courses.filter((c: any) => !c.is_deleted),
              pagination,
            };
          }
          throw new Error('Failed to fetch creator courses');
        })
      );
  }

  /**
   * Get avatar URL (reuse from ProfileService)
   */
  getAvatarUrl(user: any): string {
    return this.profileService.getAvatarUrl(user);
  }
}

