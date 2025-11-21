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

// Document Management Interfaces
export interface AdminDocument {
  id: number;
  title: string;
  description: string;
  content?: string;
  topic_id: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: number;
  students: number;
  rating: number;
  thumbnail_url?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  Creator?: {
    id: number;
    name: string;
    email: string;
  };
  Topic?: {
    id: number;
    name: string;
  };
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  topic_id?: number;
  created_by?: number;
  level?: string;
  is_deleted?: boolean;
  search?: string;
  sortBy?: string;
  students_range?: 'low' | 'medium' | 'high';
}

export interface DocumentStats {
  totalDocuments: number;
  publishedDocuments: number;
  deletedDocuments: number;
  documentsByLevel: Array<{ level: string; count: number }>;
  topTopics: Array<{ topic: { id: number; name: string }; count: number }>;
  totalStudents: number;
  averageRating: string;
}

// Problem Management Interfaces
export interface AdminProblem {
  id: number;
  title: string;
  description?: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimated_time?: string | null;
  likes: number;
  dislikes: number;
  acceptance: number;
  total_submissions: number;
  solved_count: number;
  is_new: boolean;
  is_popular: boolean;
  is_premium: boolean;
  category_id: number;
  created_by: number;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string | null;
  Creator?: {
    id: number;
    name: string;
    email: string;
  };
  Category?: {
    id: number;
    name: string;
  };
  Examples?: Array<{
    id: number;
    input: string;
    output: string;
    explanation?: string;
  }>;
  Constraints?: Array<{
    id: number;
    constraint?: string;
    constraint_text?: string;
  }>;
  StarterCodes?: Array<{
    id: number;
    language: string;
    code: string;
  }>;
  TestCases?: Array<{
    id: number;
    input: string;
    output?: string;
    expected_output?: string;
    is_hidden?: boolean;
    is_sample?: boolean;
  }>;
  Tags?: Array<{
    id: number;
    name: string;
  }>;
}

export interface ProblemFilters {
  page?: number;
  limit?: number;
  category_id?: number;
  created_by?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  is_deleted?: boolean;
  is_premium?: boolean;
  is_popular?: boolean;
  is_new?: boolean;
  search?: string;
  sortBy?: string;
  acceptance_range?: 'low' | 'medium' | 'high';
}

export interface ProblemStats {
  totalProblems: number;
  publishedProblems: number;
  deletedProblems: number;
  problemsByDifficulty: Array<{ difficulty: string; count: number }>;
  problemsByCategory: Array<{ category: { id: number; name: string }; count: number }>;
  totalSubmissions: number;
  totalSolved: number;
  averageAcceptance: string;
  popularProblems: number;
  newProblems: number;
  premiumProblems: number;
  growthRate: number;
}

export interface ProblemCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProblemTag {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Dashboard APIs
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiResponse<DashboardStats>>(
      `${this.apiUrl}/dashboard/stats`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
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

    return this.http.get<ApiResponse<{ users: AdminUser[], pagination: PaginationInfo }>>(
      `${this.apiUrl}/users`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserById(id: number): Observable<AdminUser> {
    return this.http.get<ApiResponse<AdminUser>>(
      `${this.apiUrl}/users/${id}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  updateUserRole(userId: number, role: string): Observable<AdminUser> {
    return this.http.patch<ApiResponse<AdminUser>>(
      `${this.apiUrl}/users/${userId}/role`, 
      { role },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  toggleUserStatus(userId: number, isActive: boolean): Observable<AdminUser> {
    return this.http.patch<ApiResponse<AdminUser>>(
      `${this.apiUrl}/users/${userId}/status`, 
      { is_active: isActive },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserDeletionInfo(userId: number): Observable<{
    user: { id: number; name: string; email: string; role: string };
    relatedData: {
      courses: number;
      problems: number;
      enrollments: number;
      submissions: number;
      contestSubmissions: number;
      reviews: number;
      comments: number;
    };
    canDelete: boolean;
    hasRelatedData: boolean;
    warning: string | null;
  }> {
    return this.http.get<ApiResponse<{
      user: { id: number; name: string; email: string; role: string };
      relatedData: {
        courses: number;
        problems: number;
        enrollments: number;
        submissions: number;
        contestSubmissions: number;
        reviews: number;
        comments: number;
      };
      canDelete: boolean;
      hasRelatedData: boolean;
      warning: string | null;
    }>>(
      `${this.apiUrl}/users/${userId}/deletion-info`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  deleteUser(userId: number, force: boolean = false): Observable<{ deletedUserId: number; deletedAt: string }> {
    let httpParams = new HttpParams();
    if (force) {
      httpParams = httpParams.set('force', 'true');
    }
    
    return this.http.delete<ApiResponse<{ deletedUserId: number; deletedAt: string }>>(
      `${this.apiUrl}/users/${userId}`,
      { 
        params: httpParams,
        withCredentials: true // ✅ Send HttpOnly cookie
      }
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'creator' | 'admin';
    is_active?: boolean;
    subscription_status?: 'free' | 'premium';
  }): Observable<AdminUser> {
    return this.http.post<ApiResponse<AdminUser>>(
      `${this.apiUrl}/users`,
      userData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  updateUser(userId: number, userData: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<ApiResponse<AdminUser>>(
      `${this.apiUrl}/users/${userId}`,
      userData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  bulkUpdateUsers(userIds: number[], updateData: Partial<AdminUser>): Observable<{ updatedCount: number; totalRequested: number }> {
    return this.http.patch<ApiResponse<{ updatedCount: number; totalRequested: number }>>(
      `${this.apiUrl}/users/bulk/update`,
      { user_ids: userIds, update_data: updateData },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserActivityLog(userId: number, page: number = 1, limit: number = 20): Observable<{ activities: any[], pagination: PaginationInfo }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<{ activities: any[], pagination: PaginationInfo }>>(
      `${this.apiUrl}/users/${userId}/activity`,
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/statistics`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  // User Analytics APIs
  getUserAnalyticsOverview(range: '7d' | '30d' | '90d' | '1y' = '30d'): Observable<any> {
    const params = new HttpParams().set('range', range);
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/analytics/overview`,
      { params, withCredentials: true }
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserEngagementMetrics(range: '7d' | '30d' | '90d' = '30d'): Observable<any> {
    const params = new HttpParams().set('range', range);
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/analytics/engagement`,
      { params, withCredentials: true }
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserRetentionAnalysis(cohort: 'weekly' | 'monthly' = 'monthly'): Observable<any> {
    const params = new HttpParams().set('cohort', cohort);
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/analytics/retention`,
      { params, withCredentials: true }
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserBehaviorInsights(range: '7d' | '30d' | '90d' = '30d'): Observable<any> {
    const params = new HttpParams().set('range', range);
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/analytics/behavior`,
      { params, withCredentials: true }
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getTimeBasedAnalytics(range: '7d' | '30d' | '90d' = '30d'): Observable<any> {
    const params = new HttpParams().set('range', range);
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/analytics/time-based`,
      { params, withCredentials: true }
    ).pipe(
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

    return this.http.get<ApiResponse<{ courses: AdminCourse[], pagination: PaginationInfo }>>(
      `${this.apiUrl}/courses`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getCourseById(id: number): Observable<AdminCourse> {
    return this.http.get<ApiResponse<AdminCourse>>(
      `${this.apiUrl}/courses/${id}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  updateCourseStatus(courseId: number, status: string): Observable<AdminCourse> {
    return this.http.patch<ApiResponse<AdminCourse>>(
      `${this.apiUrl}/courses/${courseId}/status`, 
      { status },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  deleteCourse(courseId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/courses/${courseId}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  getCourseStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/courses/statistics`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  // Document Management APIs
  getDocuments(filters: DocumentFilters = {}): Observable<{ documents: AdminDocument[], pagination: PaginationInfo }> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof DocumentFilters];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<AdminDocument[]>>(
      `${this.apiUrl}/documents`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => ({
        documents: response.data || [],
        pagination: response.pagination!
      })),
      catchError(this.handleError)
    );
  }

  getDocumentById(id: number): Observable<AdminDocument> {
    return this.http.get<ApiResponse<AdminDocument>>(
      `${this.apiUrl}/documents/${id}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  createDocument(documentData: {
    title: string;
    description?: string;
    content?: string;
    topic_id: number;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    duration?: number;
    thumbnail_url?: string;
    created_by?: number;
  }): Observable<AdminDocument> {
    return this.http.post<ApiResponse<AdminDocument>>(
      `${this.apiUrl}/documents`,
      documentData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  updateDocument(documentId: number, documentData: Partial<AdminDocument>): Observable<AdminDocument> {
    return this.http.put<ApiResponse<AdminDocument>>(
      `${this.apiUrl}/documents/${documentId}`,
      documentData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/documents/${documentId}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  restoreDocument(documentId: number): Observable<AdminDocument> {
    return this.http.post<ApiResponse<AdminDocument>>(
      `${this.apiUrl}/documents/${documentId}/restore`,
      {},
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  permanentlyDeleteDocument(documentId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/documents/${documentId}/permanent`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  getDocumentStatistics(): Observable<DocumentStats> {
    return this.http.get<ApiResponse<DocumentStats>>(
      `${this.apiUrl}/documents/statistics`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getDeletedDocuments(filters: { page?: number; limit?: number } = {}): Observable<{ documents: AdminDocument[], pagination: PaginationInfo }> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ApiResponse<AdminDocument[]>>(
      `${this.apiUrl}/documents/deleted`,
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => ({
        documents: response.data || [],
        pagination: response.pagination!
      })),
      catchError(this.handleError)
    );
  }

  bulkUpdateDocuments(documentIds: number[], updateData: Partial<AdminDocument>): Observable<{ updatedCount: number; totalRequested: number }> {
    return this.http.patch<ApiResponse<{ updatedCount: number; totalRequested: number }>>(
      `${this.apiUrl}/documents/bulk/update`,
      { document_ids: documentIds, update_data: updateData },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  bulkDeleteDocuments(documentIds: number[], permanent: boolean = false): Observable<{ deletedCount: number; totalRequested: number }> {
    return this.http.post<ApiResponse<{ deletedCount: number; totalRequested: number }>>(
      `${this.apiUrl}/documents/bulk/delete`,
      { document_ids: documentIds, permanent },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  bulkRestoreDocuments(documentIds: number[]): Observable<{ restoredCount: number; totalRequested: number }> {
    return this.http.post<ApiResponse<{ restoredCount: number; totalRequested: number }>>(
      `${this.apiUrl}/documents/bulk/restore`,
      { document_ids: documentIds },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  exportDocuments(format: 'json' | 'csv' = 'json', includeDeleted: boolean = false): Observable<Blob> {
    let params = new HttpParams()
      .set('format', format)
      .set('include_deleted', includeDeleted.toString());

    return this.http.get(`${this.apiUrl}/documents/export`, {
      params,
      responseType: 'blob',
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  // Problem Management APIs
  getProblems(filters: ProblemFilters = {}): Observable<{ problems: AdminProblem[], pagination: PaginationInfo }> {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof ProblemFilters];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<AdminProblem[]>>(
      `${this.apiUrl}/problems`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => ({
        problems: response.data || [],
        pagination: response.pagination!
      })),
      catchError(this.handleError)
    );
  }

  getProblemById(id: number, includeDeleted: boolean = false): Observable<AdminProblem> {
    let params = new HttpParams();
    if (includeDeleted) {
      params = params.set('include_deleted', 'true');
    }

    return this.http.get<ApiResponse<AdminProblem>>(
      `${this.apiUrl}/problems/${id}`,
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  createProblem(problemData: {
    title: string;
    description?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    estimated_time?: string;
    category_id: number;
    is_premium?: boolean;
    created_by?: number;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: Array<{ constraint: string }>;
    starter_codes?: Array<{ language: string; code: string }>;
    test_cases?: Array<{ input: string; output: string; is_hidden?: boolean }>;
    tags?: number[];
  }): Observable<AdminProblem> {
    return this.http.post<ApiResponse<AdminProblem>>(
      `${this.apiUrl}/problems`,
      problemData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  updateProblem(problemId: number, problemData: {
    title?: string;
    description?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    estimated_time?: string;
    category_id?: number;
    is_premium?: boolean;
    is_popular?: boolean;
    is_new?: boolean;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: Array<{ constraint: string }>;
    starter_codes?: Array<{ language: string; code: string }>;
    test_cases?: Array<{ input: string; output: string; is_hidden?: boolean }>;
    tags?: number[];
  }): Observable<AdminProblem> {
    return this.http.put<ApiResponse<AdminProblem>>(
      `${this.apiUrl}/problems/${problemId}`,
      problemData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  deleteProblem(problemId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/problems/${problemId}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  restoreProblem(problemId: number): Observable<AdminProblem> {
    return this.http.post<ApiResponse<AdminProblem>>(
      `${this.apiUrl}/problems/${problemId}/restore`,
      {},
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  permanentlyDeleteProblem(problemId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/problems/${problemId}/permanent`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  getProblemStatistics(): Observable<ProblemStats> {
    return this.http.get<ApiResponse<ProblemStats>>(
      `${this.apiUrl}/problems/statistics`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getDeletedProblems(filters: { page?: number; limit?: number } = {}): Observable<{ problems: AdminProblem[], pagination: PaginationInfo }> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    params = params.set('is_deleted', 'true');

    return this.http.get<ApiResponse<AdminProblem[]>>(
      `${this.apiUrl}/problems`,
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => ({
        problems: response.data || [],
        pagination: response.pagination!
      })),
      catchError(this.handleError)
    );
  }

  bulkUpdateProblems(problemIds: number[], updateData: Partial<AdminProblem>): Observable<{ updatedCount: number; totalRequested: number }> {
    return this.http.patch<ApiResponse<{ updatedCount: number; totalRequested: number }>>(
      `${this.apiUrl}/problems/bulk/update`,
      { problem_ids: problemIds, update_data: updateData },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  // Problem Category Management APIs
  getProblemCategories(): Observable<ProblemCategory[]> {
    return this.http.get<ApiResponse<ProblemCategory[]>>(
      `${this.apiUrl}/problems/categories`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  createProblemCategory(categoryData: { name: string; description?: string }): Observable<ProblemCategory> {
    return this.http.post<ApiResponse<ProblemCategory>>(
      `${this.apiUrl}/problems/categories`,
      categoryData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  updateProblemCategory(categoryId: number, categoryData: { name: string; description?: string }): Observable<ProblemCategory> {
    return this.http.put<ApiResponse<ProblemCategory>>(
      `${this.apiUrl}/problems/categories/${categoryId}`,
      categoryData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  deleteProblemCategory(categoryId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/problems/categories/${categoryId}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  // Problem Tag Management APIs
  getProblemTags(): Observable<ProblemTag[]> {
    return this.http.get<ApiResponse<ProblemTag[]>>(
      `${this.apiUrl}/problems/tags`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  createProblemTag(tagData: { name: string }): Observable<ProblemTag> {
    return this.http.post<ApiResponse<ProblemTag>>(
      `${this.apiUrl}/problems/tags`,
      tagData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  updateProblemTag(tagId: number, tagData: { name: string }): Observable<ProblemTag> {
    return this.http.put<ApiResponse<ProblemTag>>(
      `${this.apiUrl}/problems/tags/${tagId}`,
      tagData,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  deleteProblemTag(tagId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/problems/tags/${tagId}`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(() => void 0),
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

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/contests`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getContestStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/contests/statistics`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
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

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/analytics/platform`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getUserEngagementAnalytics(dateRange?: string): Observable<any> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('range', dateRange);
    }

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/analytics/engagement`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  getRevenueReports(dateRange?: string): Observable<any> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('range', dateRange);
    }

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/analytics/revenue`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  // Export APIs
  exportUsers(format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/users/export?format=${format}`, {
      responseType: 'blob',
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  exportCourses(format: 'csv' | 'json' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/courses/export?format=${format}`, {
      responseType: 'blob',
      withCredentials: true // ✅ Send HttpOnly cookie
    });
  }

  // User Report APIs
  getReportTypes(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/users/reports/types`,
      { withCredentials: true }
    ).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  generateUserReport(params: {
    type?: 'comprehensive' | 'activity' | 'registration' | 'engagement' | 'performance';
    range?: '7d' | '30d' | '90d' | '1y';
    format?: 'json' | 'csv';
    startDate?: string;
    endDate?: string;
    filters?: any;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.range) httpParams = httpParams.set('range', params.range);
    if (params.format) httpParams = httpParams.set('format', params.format);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.filters) {
      Object.keys(params.filters).forEach(key => {
        httpParams = httpParams.set(`filters[${key}]`, params.filters[key]);
      });
    }

    const options = params.format === 'csv' 
      ? { params: httpParams, responseType: 'blob' as 'json', withCredentials: true }
      : { params: httpParams, withCredentials: true };

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/users/reports/generate`,
      options
    ).pipe(
      map(response => params.format === 'csv' ? response : response.data),
      catchError(this.handleError)
    );
  }

  // Course Report APIs
  getCourseReportTypes(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/courses/reports/types`,
      { withCredentials: true }
    ).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  generateCourseReport(params: {
    type?: 'comprehensive' | 'performance' | 'enrollment' | 'revenue' | 'reviews';
    range?: '7d' | '30d' | '90d' | '1y';
    format?: 'json' | 'csv';
    startDate?: string;
    endDate?: string;
    filters?: any;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.range) httpParams = httpParams.set('range', params.range);
    if (params.format) httpParams = httpParams.set('format', params.format);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.filters) {
      Object.keys(params.filters).forEach(key => {
        httpParams = httpParams.set(`filters[${key}]`, params.filters[key]);
      });
    }

    const options = params.format === 'csv' 
      ? { params: httpParams, responseType: 'blob' as 'json', withCredentials: true }
      : { params: httpParams, withCredentials: true };

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/courses/reports/generate`,
      options
    ).pipe(
      map(response => params.format === 'csv' ? response : response.data),
      catchError(this.handleError)
    );
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