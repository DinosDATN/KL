import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap, catchError, switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UserStats, LevelProgress } from '../models/user-stats.model';

@Injectable({
  providedIn: 'root',
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
      tap((response) => {
        if (response.success && response.data?.stats) {
          this.userStatsSubject.next(response.data.stats);
        }
      }),
      catchError((error) => {
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
   * Calculate level progress using level information from backend
   * Uses level_info from UserStats if available, otherwise falls back to calculated values
   */
  calculateLevelProgress(stats: UserStats): LevelProgress {
    const currentXP = stats.xp || 0;
    const currentLevel = stats.level || 1;

    // Use level_info from backend if available
    if (stats.level_info) {
      const levelInfo = stats.level_info;
      const levelInfoLevel = levelInfo.level || currentLevel;
      const xpRequired = levelInfo.xp_required || 0;
      const xpToNext = levelInfo.xp_to_next || 0;
      const isMaxLevel = xpToNext === 0;

      // Calculate XP progress within current level
      const xpProgress = currentXP - xpRequired;
      const xpNeeded = xpToNext || 1; // Prevent division by zero

      // Calculate progress percentage
      let progressPercentage = 0;

      // If user's level in database is higher than level_info level,
      // it means user has exceeded the max level in the levels table
      if (currentLevel > levelInfoLevel) {
        // User has exceeded max level, show 100% progress
        progressPercentage = 100;
      } else if (isMaxLevel) {
        // Max level reached (xp_to_next = 0)
        progressPercentage = 100;
      } else if (xpNeeded > 0 && xpProgress >= 0) {
        // Normal calculation: progress within current level
        // Calculate percentage: (current XP - level start XP) / XP needed for next level
        progressPercentage = Math.min(
          100,
          Math.max(0, (xpProgress / xpNeeded) * 100)
        );
      } else if (xpProgress < 0) {
        // User has less XP than required for current level
        // This shouldn't happen normally, but handle gracefully
        progressPercentage = 0;
      }

      // Calculate total XP needed for next level
      const xpForNextLevel = xpRequired + xpToNext;

      const result = {
        currentLevel,
        currentXP,
        xpForNextLevel:
          isMaxLevel || currentLevel > levelInfoLevel
            ? currentXP
            : xpForNextLevel,
        xpProgress: Math.max(0, xpProgress),
        progressPercentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
      };

      return result;
    }
    // Fallback: calculate from hardcoded values (should not happen if backend is working correctly)
    const levelThresholds = [
      { level: 1, xpRequired: 0, xpToNext: 100 },
      { level: 2, xpRequired: 100, xpToNext: 200 },
      { level: 3, xpRequired: 300, xpToNext: 400 },
      { level: 4, xpRequired: 700, xpToNext: 600 },
      { level: 5, xpRequired: 1300, xpToNext: 700 },
      { level: 6, xpRequired: 2000, xpToNext: 1000 },
      { level: 7, xpRequired: 3000, xpToNext: 1500 },
      { level: 8, xpRequired: 4500, xpToNext: 500 },
      { level: 9, xpRequired: 5000, xpToNext: 700 },
      { level: 10, xpRequired: 5700, xpToNext: 0 },
    ];

    const currentLevelInfo =
      levelThresholds.find((l) => l.level === currentLevel) ||
      levelThresholds[0];
    const isMaxLevel = currentLevel >= 10 || currentLevelInfo.xpToNext === 0;

    const xpForCurrentLevel = currentLevelInfo.xpRequired;
    const xpProgress = currentXP - xpForCurrentLevel;
    const xpNeeded = currentLevelInfo.xpToNext || 1;

    let progressPercentage = 0;
    if (isMaxLevel) {
      progressPercentage = 100;
    } else if (xpNeeded > 0 && xpProgress >= 0) {
      progressPercentage = Math.min(
        100,
        Math.max(0, (xpProgress / xpNeeded) * 100)
      );
    } else if (xpProgress < 0) {
      progressPercentage = 0;
    }

    const xpForNextLevel =
      currentLevelInfo.xpRequired + currentLevelInfo.xpToNext;

    return {
      currentLevel,
      currentXP,
      xpForNextLevel: isMaxLevel ? currentXP : xpForNextLevel,
      xpProgress: Math.max(0, xpProgress),
      progressPercentage,
    };
  }

  /**
   * Get reward points
   */
  getRewardPoints(): Observable<any> {
    return this.http.get<any>(
      `${this.rewardApiUrl}/points`,
      { withCredentials: true } // ✅ Send HttpOnly cookie
    );
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
