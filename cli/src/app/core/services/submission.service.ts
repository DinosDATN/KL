import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Submission {
  id: number;
  user_id: number;
  problem_id: number;
  code_id: number;
  language: string;
  status: 'pending' | 'accepted' | 'wrong' | 'error' | 'timeout';
  score: number;
  exec_time?: number;
  memory_used?: number;
  submitted_at: string;
  User?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  Problem?: {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description?: string;
    Category?: {
      id: number;
      name: string;
    };
  };
  Code?: {
    id: number;
    source_code: string;
  };
}

export interface SubmissionStats {
  total_submissions: number;
  status_breakdown: Array<{
    status: string;
    count: number;
  }>;
  language_breakdown: Array<{
    language: string;
    count: number;
  }>;
  time_range_days: number;
}

export interface SubmissionFilters {
  page?: number;
  limit?: number;
  status?: string;
  language?: string;
  problem_id?: number;
  user_id?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  include_code?: boolean;
}

export interface PaginatedSubmissions {
  submissions: Submission[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  private apiUrl = `${environment.apiUrl}/submissions`;
  
  // Subject to track current submissions for reactive updates
  private submissionsSubject = new BehaviorSubject<PaginatedSubmissions | null>(null);
  public submissions$ = this.submissionsSubject.asObservable();

  // Subject to track current filters
  private filtersSubject = new BehaviorSubject<SubmissionFilters>({});
  public filters$ = this.filtersSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get paginated submissions with filters
   */
  getSubmissions(filters: SubmissionFilters = {}): Observable<PaginatedSubmissions> {
    let params = new HttpParams();
    
    // Build query parameters
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'include_code') {
          params = params.set(key, value.toString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<{ success: boolean; data: PaginatedSubmissions }>(
      this.apiUrl, { params }
    ).pipe(
      map(response => response.data),
      tap(data => {
        this.submissionsSubject.next(data);
        this.filtersSubject.next(filters);
      })
    );
  }

  /**
   * Get a single submission by ID
   */
  getSubmissionById(id: number, includeCode: boolean = false): Observable<Submission> {
    let params = new HttpParams();
    if (includeCode) {
      params = params.set('include_code', 'true');
    }

    return this.http.get<{ success: boolean; data: Submission }>(
      `${this.apiUrl}/${id}`, { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get submissions by user ID
   */
  getUserSubmissions(
    userId: number, 
    filters: Omit<SubmissionFilters, 'user_id'> = {}
  ): Observable<PaginatedSubmissions> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ success: boolean; data: PaginatedSubmissions }>(
      `${this.apiUrl}/user/${userId}`, { params }
    ).pipe(
      map(response => response.data),
      tap(data => {
        this.submissionsSubject.next(data);
      })
    );
  }

  /**
   * Get submission statistics
   */
  getSubmissionStats(filters: {
    user_id?: number;
    problem_id?: number;
    time_range?: number;
  } = {}): Observable<SubmissionStats> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<{ success: boolean; data: SubmissionStats }>(
      `${this.apiUrl}/stats`, { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Update current filters
   */
  updateFilters(filters: SubmissionFilters): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  /**
   * Clear current filters
   */
  clearFilters(): void {
    this.filtersSubject.next({});
  }

  /**
   * Get status color class for styling
   */
  getStatusColorClass(status: string): string {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'wrong':
        return 'text-red-600 bg-red-100';
      case 'error':
        return 'text-orange-600 bg-orange-100';
      case 'timeout':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Get difficulty color class for styling
   */
  getDifficultyColorClass(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Format execution time for display
   */
  formatExecutionTime(execTime?: number): string {
    if (!execTime) return 'N/A';
    if (execTime < 1000) return `${execTime}ms`;
    return `${(execTime / 1000).toFixed(2)}s`;
  }

  /**
   * Format memory usage for display
   */
  formatMemoryUsage(memoryUsed?: number): string {
    if (!memoryUsed) return 'N/A';
    if (memoryUsed < 1024) return `${memoryUsed}B`;
    if (memoryUsed < 1024 * 1024) return `${(memoryUsed / 1024).toFixed(2)}KB`;
    return `${(memoryUsed / (1024 * 1024)).toFixed(2)}MB`;
  }

  /**
   * Check if user can view submission code
   */
  canViewCode(submission: Submission, currentUserId?: number): boolean {
    if (!currentUserId) return false;
    return submission.user_id === currentUserId;
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language: string): string {
    const languageMap: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'typescript': 'TypeScript',
      'go': 'Go',
      'rust': 'Rust',
      'php': 'PHP'
    };
    return languageMap[language] || language.toUpperCase();
  }
}
