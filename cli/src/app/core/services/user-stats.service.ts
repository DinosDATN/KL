import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap, catchError, switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserStats, LevelProgress } from '../models/user-stats.model';

@Injectable({
  providedIn: 'root'
})
export class UserStatsService {
  private apiUrl = `${environment.apiUrl}/users`;
  private rewardApiUrl = `${environment.apiUrl}/rewards`;
  
  private userStatsSubject = new BehaviorSubject<UserStats | null>(null);
  public userStats$ = this.userStatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load user stats from profile endpoint
   */
  loadUserStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile/me`).pipe(
      tap(response => {
        if (response.success && response.data?.stats) {
          this.userStatsSubject.next(response.data.stats);
        }
      }),
      catchError(error => {
        console.error('Error loading user stats:', error);
        // Don't throw error, just return empty to prevent breaking the app
        return [];
      })
    );
  }

  /**
   * Get current user stats
   */
  getUserStats(): UserStats | null {
    return this.userStatsSubject.value;
  }

  /**
   * Calculate level progress
   */
  calculateLevelProgress(stats: UserStats): LevelProgress {
    const currentLevel = stats.level;
    const currentXP = stats.xp;
    
    // Formula: XP needed for level N = N * 100
    // Example: Level 1->2 needs 100 XP, Level 2->3 needs 200 XP, etc.
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const xpProgress = currentXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));

    return {
      currentLevel,
      currentXP,
      xpForNextLevel,
      xpProgress,
      progressPercentage
    };
  }

  /**
   * Get reward points
   */
  getRewardPoints(): Observable<any> {
    return this.http.get<any>(`${this.rewardApiUrl}/points`);
  }

  /**
   * Refresh stats periodically (every 30 seconds)
   */
  startAutoRefresh(): Observable<any> {
    return interval(30000).pipe(
      startWith(0),
      switchMap(() => this.loadUserStats())
    );
  }

  /**
   * Clear stats on logout
   */
  clearStats(): void {
    this.userStatsSubject.next(null);
  }
}
