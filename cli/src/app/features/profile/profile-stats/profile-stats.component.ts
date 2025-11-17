import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { UserStatsService } from '../../../core/services/user-stats.service';
import { UserStats, LevelProgress } from '../../../core/models/user-stats.model';
import { UserStatsBadgeComponent } from '../../../shared/components/user-stats-badge/user-stats-badge.component';

@Component({
  selector: 'app-profile-stats',
  standalone: true,
  imports: [CommonModule, UserStatsBadgeComponent],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Thống kê của bạn
      </h2>

      <!-- Stats Badges -->
      <div *ngIf="userStats" class="mb-8">
        <app-user-stats-badge 
          [stats]="userStats" 
          [levelProgress]="levelProgress"
        ></app-user-stats-badge>
      </div>

      <!-- Detailed Stats Grid -->
      <div *ngIf="userStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Problems Solved -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-600 dark:text-green-400 font-medium">Bài tập đã giải</p>
              <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {{ userStats.problems_solved }}
              </p>
            </div>
            <i class="icon-check-circle text-3xl text-green-500"></i>
          </div>
        </div>

        <!-- Courses Completed -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Khóa học hoàn thành</p>
              <p class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {{ userStats.courses_completed }}
              </p>
            </div>
            <i class="icon-book text-3xl text-blue-500"></i>
          </div>
        </div>

        <!-- Hours Learned -->
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-purple-600 dark:text-purple-400 font-medium">Giờ học</p>
              <p class="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                {{ userStats.hours_learned }}
              </p>
            </div>
            <i class="icon-clock text-3xl text-purple-500"></i>
          </div>
        </div>

        <!-- Current Streak -->
        <div class="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-orange-600 dark:text-orange-400 font-medium">Streak hiện tại</p>
              <p class="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                {{ userStats.current_streak }} ngày
              </p>
            </div>
            <i class="icon-zap text-3xl text-orange-500"></i>
          </div>
        </div>

        <!-- Longest Streak -->
        <div class="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Streak dài nhất</p>
              <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                {{ userStats.longest_streak }} ngày
              </p>
            </div>
            <i class="icon-trending-up text-3xl text-yellow-500"></i>
          </div>
        </div>

        <!-- Average Score -->
        <div class="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-teal-600 dark:text-teal-400 font-medium">Điểm trung bình</p>
              <p class="text-2xl font-bold text-teal-700 dark:text-teal-300 mt-1">
                {{ userStats.average_score | number:'1.0-1' }}%
              </p>
            </div>
            <i class="icon-bar-chart text-3xl text-teal-500"></i>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="!userStats" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p class="text-gray-500 dark:text-gray-400 mt-4">Đang tải thống kê...</p>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileStatsComponent implements OnInit, OnDestroy {
  userStats: UserStats | null = null;
  levelProgress: LevelProgress | null = null;
  private statsSubscription?: Subscription;

  constructor(private userStatsService: UserStatsService) {}

  ngOnInit(): void {
    // Load stats
    this.userStatsService.loadUserStats().subscribe();

    // Subscribe to stats updates
    this.statsSubscription = this.userStatsService.userStats$.subscribe(
      (stats) => {
        this.userStats = stats;
        if (stats) {
          this.levelProgress = this.userStatsService.calculateLevelProgress(stats);
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
  }
}
