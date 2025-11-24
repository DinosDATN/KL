import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CreatorApplication, CreatorApplicationFormData } from '../models/creator-application.model';

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

@Injectable({
  providedIn: 'root',
})
export class CreatorApplicationService {
  private readonly apiUrl = `${environment.apiUrl}/creator-applications`;

  constructor(private http: HttpClient) {}

  /**
   * Submit a creator application
   */
  submitApplication(
    applicationData: CreatorApplicationFormData
  ): Observable<ApiResponse<CreatorApplication>> {
    return this.http
      .post<ApiResponse<CreatorApplication>>(
        this.apiUrl,
        applicationData,
        { withCredentials: true }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current user's application status
   */
  getMyApplication(): Observable<CreatorApplication> {
    return this.http
      .get<ApiResponse<CreatorApplication>>(`${this.apiUrl}/me`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error('Application data not found');
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get all applications (Admin only)
   */
  getAllApplications(filters: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected';
    search?: string;
  } = {}): Observable<{
    applications: CreatorApplication[];
    pagination: PaginationInfo;
  }> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);

    return this.http
      .get<ApiResponse<CreatorApplication[]>>(this.apiUrl, {
        params,
        withCredentials: true,
      })
      .pipe(
        map((response) => ({
          applications: response.data || [],
          pagination: response.pagination!,
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Get application by ID (Admin only)
   */
  getApplicationById(id: number): Observable<CreatorApplication> {
    return this.http
      .get<ApiResponse<CreatorApplication>>(`${this.apiUrl}/${id}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Approve application (Admin only)
   */
  approveApplication(id: number): Observable<CreatorApplication> {
    return this.http
      .patch<ApiResponse<CreatorApplication>>(
        `${this.apiUrl}/${id}/approve`,
        {},
        { withCredentials: true }
      )
      .pipe(
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Reject application (Admin only)
   */
  rejectApplication(
    id: number,
    rejectionReason?: string
  ): Observable<CreatorApplication> {
    return this.http
      .patch<ApiResponse<CreatorApplication>>(
        `${this.apiUrl}/${id}/reject`,
        { rejection_reason: rejectionReason },
        { withCredentials: true }
      )
      .pipe(
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Error handling
   */
  private handleError = (error: HttpErrorResponse) => {
    // Don't log 404 errors as they're expected when no application exists
    if (error.status !== 404) {
      console.error('Creator Application API error:', error);
    }

    let errorMessage = 'An unexpected error occurred';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => ({
      ...error.error,
      message: errorMessage,
      status: error.status,
    }));
  };
}

