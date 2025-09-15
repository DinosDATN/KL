import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Judge0Language {
  id: string;
  name: string;
  judgeId: number;
}

export interface Judge0ExecutionRequest {
  source_code: string;
  language: string;
  stdin?: string;
}

export interface Judge0SubmissionRequest {
  source_code: string;
  language: string;
  test_cases: Array<{
    input: string;
    expected_output: string;
  }>;
}

export interface Judge0ExecutionResult {
  output: string;
  error: string | null;
  status: 'completed' | 'error';
  execution_time: number;
  memory_used: number;
}

export interface Judge0SubmissionResult {
  submission_id: string;
  status: string;
  score: number;
  execution_time: number;
  memory_used: number;
  test_cases_passed: number;
  total_test_cases: number;
  test_results: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime: number;
    error: string | null;
  }>;
  error: string | null;
}

export interface Judge0HealthStatus {
  judge0_available: boolean;
  test_execution_time: number;
  last_check: string;
}

@Injectable({
  providedIn: 'root'
})
export class Judge0Service {
  private readonly apiUrl = `${environment.apiUrl}/judge0`;

  constructor(private http: HttpClient) {}

  /**
   * Execute code with custom input
   */
  executeCode(request: Judge0ExecutionRequest): Observable<Judge0ExecutionResult> {
    return this.http.post<{success: boolean, data: Judge0ExecutionResult}>(`${this.apiUrl}/execute`, request)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Execution failed');
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Submit code for evaluation against test cases
   */
  submitCode(request: Judge0SubmissionRequest): Observable<Judge0SubmissionResult> {
    return this.http.post<{success: boolean, data: Judge0SubmissionResult}>(`${this.apiUrl}/submit`, request)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Submission failed');
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get supported programming languages
   */
  getSupportedLanguages(): Observable<Judge0Language[]> {
    return this.http.get<{success: boolean, data: Judge0Language[]}>(`${this.apiUrl}/languages`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Failed to fetch languages');
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Check Judge0 service health
   */
  checkHealth(): Observable<Judge0HealthStatus> {
    return this.http.get<{success: boolean, message: string, data: Judge0HealthStatus}>(`${this.apiUrl}/health`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error('Health check failed');
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      } else if (error.status === 404) {
        errorMessage = 'The requested service is not available.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
    }

    console.error('Judge0Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
