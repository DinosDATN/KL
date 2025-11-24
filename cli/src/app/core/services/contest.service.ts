import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Contest,
  ContestProblem,
  UserContest,
  ContestSubmission,
  ContestLeaderboardEntry,
  CreateContestRequest,
  ContestFilters,
  ContestSubmissionRequest,
  ContestExecutionResult
} from '../models/contest.model';
import { Problem } from '../models/problem.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContestService {
  private readonly apiUrl = `${environment.apiUrl}/contests`;

  constructor(private http: HttpClient) {}

  // Get all contests with filtering and pagination
  getAllContests(
    page: number = 1,
    limit: number = 10,
    filters?: ContestFilters
  ): Observable<ApiResponse<Contest[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }
    if (filters?.created_by) {
      params = params.set('created_by', filters.created_by.toString());
    }

    return this.http.get<ApiResponse<Contest[]>>(this.apiUrl, { params });
  }

  // Get contest by ID
  getContestById(id: number): Observable<ApiResponse<Contest>> {
    return this.http.get<ApiResponse<Contest>>(`${this.apiUrl}/${id}`);
  }

  // Create contest
  createContest(contest: CreateContestRequest): Observable<ApiResponse<Contest>> {
    return this.http.post<ApiResponse<Contest>>(this.apiUrl, contest, {
      withCredentials: true
    });
  }

  // Update contest
  updateContest(id: number, contest: Partial<CreateContestRequest>): Observable<ApiResponse<Contest>> {
    return this.http.put<ApiResponse<Contest>>(`${this.apiUrl}/${id}`, contest);
  }

  // Delete contest
  deleteContest(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Register for contest
  registerForContest(contestId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${contestId}/register`, {});
  }

  // Unregister from contest
  unregisterFromContest(contestId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${contestId}/register`);
  }

  // Get contest problems
  getContestProblems(contestId: number): Observable<ApiResponse<ContestProblem[]>> {
    return this.http.get<ApiResponse<ContestProblem[]>>(`${this.apiUrl}/${contestId}/problems`);
  }

  // Add problem to contest
  addProblemToContest(contestId: number, problemId: number, score: number = 100): Observable<ApiResponse<ContestProblem>> {
    return this.http.post<ApiResponse<ContestProblem>>(`${this.apiUrl}/${contestId}/problems`, {
      problem_id: problemId,
      score
    });
  }

  // Remove problem from contest
  removeProblemFromContest(contestId: number, problemId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${contestId}/problems/${problemId}`);
  }

  // Submit solution to contest
  submitToContest(
    contestId: number,
    problemId: number,
    submission: ContestSubmissionRequest
  ): Observable<ApiResponse<{ submission: ContestSubmission; execution_result: ContestExecutionResult }>> {
    return this.http.post<ApiResponse<{ submission: ContestSubmission; execution_result: ContestExecutionResult }>>(
      `${this.apiUrl}/${contestId}/problems/${problemId}/submit`,
      submission
    );
  }

  // Get contest leaderboard
  getContestLeaderboard(
    contestId: number,
    page: number = 1,
    limit: number = 50
  ): Observable<ApiResponse<ContestLeaderboardEntry[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<ContestLeaderboardEntry[]>>(`${this.apiUrl}/${contestId}/leaderboard`, { params });
  }

  // Get user contest submissions
  getUserContestSubmissions(
    contestId: number,
    page: number = 1,
    limit: number = 20
  ): Observable<ApiResponse<ContestSubmission[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<ContestSubmission[]>>(`${this.apiUrl}/${contestId}/submissions`, { params });
  }

  // Get contest participants
  getContestParticipants(
    contestId: number,
    page: number = 1,
    limit: number = 20
  ): Observable<ApiResponse<UserContest[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<UserContest[]>>(`${this.apiUrl}/${contestId}/participants`, { params });
  }

  // Get active contests
  getActiveContests(): Observable<ApiResponse<Contest[]>> {
    return this.http.get<ApiResponse<Contest[]>>(`${this.apiUrl}/active`);
  }

  // Get upcoming contests
  getUpcomingContests(): Observable<ApiResponse<Contest[]>> {
    return this.http.get<ApiResponse<Contest[]>>(`${this.apiUrl}/upcoming`);
  }

  // Get past contests
  getPastContests(page: number = 1, limit: number = 10): Observable<ApiResponse<Contest[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<Contest[]>>(`${this.apiUrl}/past`, { params });
  }

  // Utility methods
  getContestStatusColor(status?: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'upcoming':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'completed':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  }

  getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'Hard':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  }

  formatTimeRemaining(minutes?: number): string {
    if (!minutes || minutes <= 0) return '0 phút';
    
    if (minutes < 60) {
      return `${minutes} phút`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'p' : ''}`.trim();
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours > 0 ? hours + 'h' : ''}`.trim();
    }
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} phút`;
    } else {
      return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'p' : ''}`.trim();
    }
  }
}
