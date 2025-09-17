import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SubmissionTestResult {
  id: number;
  submission_id: number;
  test_case_id?: number;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  execution_time?: number;
  memory_used?: number;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SubmissionDetail {
  id: number;
  user_id: number;
  problem_id: number;
  code_id: number;
  language: string;
  status: 'pending' | 'accepted' | 'wrong' | 'error' | 'timeout';
  score: number;
  exec_time?: number;
  memory_used?: number;
  test_cases_passed: number;
  total_test_cases: number;
  error_message?: string;
  submitted_at: Date;
  Code?: {
    source_code: string;
  };
  TestResults?: SubmissionTestResult[];
  Problem?: {
    id: number;
    title: string;
    difficulty: string;
  };
}

export interface PaginatedSubmissions {
  data: SubmissionDetail[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  private readonly apiUrl = `${environment.apiUrl}/problems`;

  constructor(private http: HttpClient) {}

  /**
   * Get submissions for a specific problem
   */
  getProblemSubmissions(problemId: number, userId?: number, page: number = 1, limit: number = 10): Observable<PaginatedSubmissions> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    if (userId) {
      params.userId = userId.toString();
    }

    return this.http.get<{success: boolean, data: SubmissionDetail[], pagination: any}>(`${this.apiUrl}/${problemId}/submissions`, { params })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to fetch submissions');
          }
          return {
            data: response.data,
            pagination: response.pagination
          };
        }),
        catchError(error => {
          console.error('Error fetching problem submissions:', error);
          return of({
            data: [],
            pagination: { current_page: 1, total_pages: 0, total_items: 0, items_per_page: limit }
          });
        })
      );
  }

  /**
   * Get all submissions for a specific user
   */
  getUserSubmissions(userId: number, page: number = 1, limit: number = 10, filters?: {status?: string, language?: string}): Observable<PaginatedSubmissions> {
    let params: any = { page: page.toString(), limit: limit.toString() };
    if (filters?.status) params.status = filters.status;
    if (filters?.language) params.language = filters.language;

    return this.http.get<{success: boolean, data: SubmissionDetail[], pagination: any}>(`${this.apiUrl}/users/${userId}/submissions`, { params })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to fetch user submissions');
          }
          return {
            data: response.data,
            pagination: response.pagination
          };
        }),
        catchError(error => {
          console.error('Error fetching user submissions:', error);
          return of({
            data: [],
            pagination: { current_page: 1, total_pages: 0, total_items: 0, items_per_page: limit }
          });
        })
      );
  }

  /**
   * Get detailed information about a specific submission
   */
  getSubmissionById(submissionId: number): Observable<SubmissionDetail | null> {
    return this.http.get<{success: boolean, data: SubmissionDetail}>(`${this.apiUrl}/submissions/${submissionId}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to fetch submission details');
          }
          return response.data;
        }),
        catchError(error => {
          console.error('Error fetching submission details:', error);
          return of(null);
        })
      );
  }

  /**
   * Get submission statistics for a user
   */
  getUserSubmissionStats(userId: number): Observable<{
    totalSubmissions: number;
    acceptedSubmissions: number;
    wrongAnswerSubmissions: number;
    errorSubmissions: number;
    acceptanceRate: number;
    favoriteLanguages: Array<{language: string, count: number}>;
  }> {
    // This would typically come from a separate analytics endpoint
    // For now, we'll calculate from user submissions
    return this.getUserSubmissions(userId, 1, 1000).pipe(
      map(response => {
        const submissions = response.data;
        const totalSubmissions = submissions.length;
        const acceptedSubmissions = submissions.filter(s => s.status === 'accepted').length;
        const wrongAnswerSubmissions = submissions.filter(s => s.status === 'wrong').length;
        const errorSubmissions = submissions.filter(s => s.status === 'error').length;
        const acceptanceRate = totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0;
        
        // Count languages
        const languageCount = submissions.reduce((acc, submission) => {
          acc[submission.language] = (acc[submission.language] || 0) + 1;
          return acc;
        }, {} as {[key: string]: number});
        
        const favoriteLanguages = Object.entries(languageCount)
          .map(([language, count]) => ({language, count}))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          totalSubmissions,
          acceptedSubmissions,
          wrongAnswerSubmissions,
          errorSubmissions,
          acceptanceRate,
          favoriteLanguages
        };
      })
    );
  }

  /**
   * Format submission status for display
   */
  getStatusDisplayInfo(status: string): {text: string, color: string, icon: string} {
    switch (status) {
      case 'accepted':
        return { text: 'Accepted', color: 'text-green-600', icon: '✓' };
      case 'wrong':
        return { text: 'Wrong Answer', color: 'text-red-600', icon: '✗' };
      case 'error':
        return { text: 'Runtime Error', color: 'text-orange-600', icon: '!' };
      case 'timeout':
        return { text: 'Time Limit Exceeded', color: 'text-yellow-600', icon: '⏱' };
      case 'pending':
        return { text: 'Processing', color: 'text-blue-600', icon: '⏳' };
      default:
        return { text: 'Unknown', color: 'text-gray-600', icon: '?' };
    }
  }

  /**
   * Format language display name
   */
  getLanguageDisplayName(language: string): string {
    const languageMap: {[key: string]: string} = {
      '63': 'JavaScript',
      '71': 'Python 3',
      '62': 'Java',
      '54': 'C++',
      '50': 'C',
      'javascript': 'JavaScript',
      'python': 'Python 3',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C'
    };
    
    return languageMap[language] || language;
  }
}
