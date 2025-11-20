import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface AdminInstructor {
  id: number;
  name: string;
  email: string;
  role: 'creator';
  is_active: boolean;
  is_online: boolean;
  subscription_status: 'free' | 'premium';
  subscription_end_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_seen_at?: string;
  courses_count?: number;
  students_count?: number;
  avg_rating?: number;
  total_revenue?: number;
  Profile?: {
    bio?: string;
    birthday?: string;
    gender?: 'male' | 'female' | 'other';
    phone?: string;
    address?: string;
    website_url?: string;
    github_url?: string;
    linkedin_url?: string;
  };
  Qualifications?: InstructorQualification[];
}

export interface InstructorQualification {
  id: number;
  user_id: number;
  title: string;
  institution?: string;
  date?: string;
  credential_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  has_courses?: boolean;
  min_courses?: number;
  min_students?: number;
  min_rating?: number;
  sortBy?: string;
  registration_date?: string;
}

export interface InstructorStatistics {
  total_instructors: number;
  active_instructors: number;
  inactive_instructors: number;
  instructors_with_courses: number;
  instructors_without_courses: number;
  total_courses: number;
  total_students: number;
  average_rating: string;
}

export interface InstructorDetail {
  instructor: AdminInstructor;
  courses: Course[];
  statistics: {
    total_courses: number;
    published_courses: number;
    total_students: number;
    unique_students: number;
    average_rating: string;
    total_revenue: number;
    recent_enrollments: number;
  };
}

export interface Course {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'archived';
  students: number;
  rating: number;
  revenue: number;
  created_at: string;
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

export interface UpdateInstructorRequest {
  name?: string;
  email?: string;
  is_active?: boolean;
  subscription_status?: 'free' | 'premium';
  subscription_end_date?: string;
}

export interface CreateQualificationRequest {
  title: string;
  institution?: string;
  date?: string;
  credential_url?: string;
}

export interface UpdateQualificationRequest {
  title?: string;
  institution?: string;
  date?: string;
  credential_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminInstructorService {
  private readonly apiUrl = `${environment.apiUrl}/admin/instructors`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get all instructors for admin with filters and pagination
   */
  getInstructors(filters: InstructorFilters = {}): Observable<PaginatedResponse<AdminInstructor>> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof InstructorFilters];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<AdminInstructor>>(this.apiUrl, { 
      params,
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Get a single instructor by ID with detailed information
   */
  getInstructor(id: number): Observable<ApiResponse<InstructorDetail>> {
    return this.http.get<ApiResponse<InstructorDetail>>(`${this.apiUrl}/${id}`, { 
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Update an instructor
   */
  updateInstructor(id: number, instructorData: UpdateInstructorRequest): Observable<ApiResponse<AdminInstructor>> {
    return this.http.put<ApiResponse<AdminInstructor>>(`${this.apiUrl}/${id}`, instructorData, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Toggle instructor status (activate/deactivate)
   */
  toggleInstructorStatus(id: number): Observable<ApiResponse<AdminInstructor>> {
    return this.http.patch<ApiResponse<AdminInstructor>>(`${this.apiUrl}/${id}/status`, {}, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Get instructor statistics
   */
  getStatistics(): Observable<ApiResponse<InstructorStatistics>> {
    return this.http.get<ApiResponse<InstructorStatistics>>(`${this.apiUrl}/statistics`, {
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  /**
   * Create instructor qualification
   */
  createQualification(instructorId: number, qualificationData: CreateQualificationRequest): Observable<ApiResponse<InstructorQualification>> {
    return this.http.post<ApiResponse<InstructorQualification>>(
      `${this.apiUrl}/${instructorId}/qualifications`,
      qualificationData,
      {
        withCredentials: true // ✅ Send HttpOnly cookie
      }
    );
  }

  /**
   * Update instructor qualification
   */
  updateQualification(
    instructorId: number,
    qualificationId: number,
    qualificationData: UpdateQualificationRequest
  ): Observable<ApiResponse<InstructorQualification>> {
    return this.http.put<ApiResponse<InstructorQualification>>(
      `${this.apiUrl}/${instructorId}/qualifications/${qualificationId}`,
      qualificationData,
      {
        withCredentials: true // ✅ Send HttpOnly cookie
      }
    );
  }

  /**
   * Delete instructor qualification
   */
  deleteQualification(instructorId: number, qualificationId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${instructorId}/qualifications/${qualificationId}`,
      {
        withCredentials: true // ✅ Send HttpOnly cookie
      }
    );
  }
}


