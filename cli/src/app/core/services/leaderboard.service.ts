import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User, UserProfile, UserStat } from '../models/user.model';
import {
  LeaderboardEntry,
  Level,
  Badge,
  UserBadge,
} from '../models/gamification.model';

export interface LeaderboardResponse {
  success: boolean;
  data: {
    entries: LeaderboardRow[];
    levels: Level[];
    period: string;
    total: number;
  };
}

export interface LeaderboardRow {
  rank: number;
  user: User;
  profile?: UserProfile;
  stats?: UserStat;
  entry?: LeaderboardEntry;
  level?: Level;
  badges: Badge[];
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private apiUrl = `${environment.apiUrl}/leaderboard`;
  private currentDataSubject = new BehaviorSubject<LeaderboardRow[]>([]);
  public currentData$ = this.currentDataSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Get comprehensive leaderboard data
   */
  getLeaderboard(
    period: 'weekly' | 'monthly' = 'weekly',
    limit: number = 50,
    search: string = '',
    sortBy: 'xp' | 'level' | 'rank' = 'xp',
    sortOrder: 'desc' | 'asc' = 'desc'
  ): Observable<LeaderboardResponse> {
    // Return empty data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      const emptyResponse: LeaderboardResponse = {
        success: true,
        data: {
          entries: [],
          levels: [],
          period: period,
          total: 0
        }
      };
      return of(emptyResponse);
    }

    let params = new HttpParams()
      .set('period', period)
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);
    
    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<LeaderboardResponse>(this.apiUrl, { params })
      .pipe(
        map(response => {
          if (response.success) {
            this.currentDataSubject.next(response.data.entries);
          }
          return response;
        }),
        catchError(error => {
          console.error('Error fetching leaderboard:', error);
          // Return empty data on error
          const emptyResponse: LeaderboardResponse = {
            success: false,
            data: {
              entries: [],
              levels: [],
              period: period,
              total: 0
            }
          };
          return of(emptyResponse);
        })
      );
  }

  /**
   * Get user profiles by user IDs
   */
  getUserProfiles(userIds: number[]): Observable<UserProfile[]> {
    const params = new HttpParams().set('user_ids', userIds.join(','));
    
    return this.http.get<{success: boolean, data: UserProfile[]}>(`${this.apiUrl}/profiles`, { params })
      .pipe(
        map(response => response.success ? response.data : []),
        catchError(error => {
          console.error('Error fetching user profiles:', error);
          return of([]);
        })
      );
  }

  /**
   * Get user stats by user IDs
   */
  getUserStats(userIds: number[]): Observable<UserStat[]> {
    const params = new HttpParams().set('user_ids', userIds.join(','));
    
    return this.http.get<{success: boolean, data: UserStat[]}>(`${this.apiUrl}/stats`, { params })
      .pipe(
        map(response => response.success ? response.data : []),
        catchError(error => {
          console.error('Error fetching user stats:', error);
          return of([]);
        })
      );
  }

  /**
   * Get all levels
   */
  getLevels(): Observable<Level[]> {
    return this.http.get<{success: boolean, data: Level[]}>(`${this.apiUrl}/levels`)
      .pipe(
        map(response => response.success ? response.data : []),
        catchError(error => {
          console.error('Error fetching levels:', error);
          return of([]);
        })
      );
  }

  /**
   * Get badges
   */
  getBadges(categoryId?: number): Observable<Badge[]> {
    let params = new HttpParams();
    if (categoryId) {
      params = params.set('category_id', categoryId.toString());
    }

    return this.http.get<{success: boolean, data: Badge[]}>(`${this.apiUrl}/badges`, { params })
      .pipe(
        map(response => response.success ? response.data : []),
        catchError(error => {
          console.error('Error fetching badges:', error);
          return of([]);
        })
      );
  }

  /**
   * Get user badges by user IDs
   */
  getUserBadges(userIds: number[]): Observable<UserBadge[]> {
    const params = new HttpParams().set('user_ids', userIds.join(','));
    
    return this.http.get<{success: boolean, data: UserBadge[]}>(`${this.apiUrl}/user-badges`, { params })
      .pipe(
        map(response => response.success ? response.data : []),
        catchError(error => {
          console.error('Error fetching user badges:', error);
          return of([]);
        })
      );
  }

  /**
   * Get leaderboard entries
   */
  getLeaderboardEntries(period: 'weekly' | 'monthly' = 'weekly', limit: number = 50): Observable<LeaderboardEntry[]> {
    const params = new HttpParams()
      .set('period', period)
      .set('limit', limit.toString());

    return this.http.get<{success: boolean, data: LeaderboardEntry[]}>(`${this.apiUrl}/entries`, { params })
      .pipe(
        map(response => response.success ? response.data : []),
        catchError(error => {
          console.error('Error fetching leaderboard entries:', error);
          return of([]);
        })
      );
  }

  /**
   * Clear current data
   */
  clearCurrentData(): void {
    this.currentDataSubject.next([]);
  }

  /**
   * Get current leaderboard data without making new API call
   */
  getCurrentData(): LeaderboardRow[] {
    return this.currentDataSubject.value;
  }
}
