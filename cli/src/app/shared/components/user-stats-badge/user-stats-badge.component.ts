import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStats, LevelProgress } from '../../../core/models/user-stats.model';

@Component({
  selector: 'app-user-stats-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3">
      <!-- Reward Points -->
      <div 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
        [ngClass]="compact ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' : 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'"
        [title]="'Điểm thưởng: ' + (stats?.reward_points || 0)"
      >
        <i class="icon-award text-yellow-600 dark:text-yellow-400" [class.text-sm]="compact"></i>
        <span 
          class="font-semibold text-yellow-700 dark:text-yellow-300"
          [class.text-sm]="compact"
          [class.text-xs]="compact"
        >
          {{ stats?.reward_points | number }}
        </span>
      </div>

      <!-- Level & XP Progress -->
      <div 
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
        [ngClass]="compact ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'"
      >
        <div class="flex items-center gap-1.5">
          <i class="icon-zap text-blue-600 dark:text-blue-400" [class.text-sm]="compact"></i>
          <span 
            class="font-semibold text-blue-700 dark:text-blue-300"
            [class.text-sm]="compact"
            [class.text-xs]="compact"
          >
            Lv {{ stats?.level || 1 }}
          </span>
        </div>
        
        <div *ngIf="!compact" class="w-px h-4 bg-blue-300 dark:bg-blue-700"></div>
        
        <div class="flex flex-col gap-0.5" [class.min-w-[80px]]="!compact">
          <div class="flex items-center justify-between">
            <span 
              class="text-blue-600 dark:text-blue-400 font-medium"
              [class.text-xs]="!compact"
              [class.text-[10px]]="compact"
            >
              {{ stats?.xp | number }} XP
            </span>
            <span 
              class="text-blue-500 dark:text-blue-500"
              [class.text-xs]="!compact"
              [class.text-[10px]]="compact"
            >
              {{ levelProgress?.progressPercentage | number:'1.0-0' }}%
            </span>
          </div>
          <div 
            class="w-full bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden"
            [class.h-1.5]="!compact"
            [class.h-1]="compact"
          >
            <div 
              class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              [style.width.%]="levelProgress?.progressPercentage || 0"
            ></div>
          </div>
        </div>
      </div>

      <!-- Rank (if available) -->
      <div 
        *ngIf="stats && stats.rank > 0"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer hover:scale-105 transition-transform"
        [ngClass]="compact ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700' : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800'"
        [title]="'Xếp hạng: #' + stats.rank"
      >
        <i class="icon-trophy text-purple-600 dark:text-purple-400" [class.text-sm]="compact"></i>
        <span 
          class="font-semibold text-purple-700 dark:text-purple-300"
          [class.text-sm]="compact"
          [class.text-xs]="compact"
        >
          #{{ stats.rank }}
        </span>
      </div>
    </div>
  `,
  styles: []
})
export class UserStatsBadgeComponent {
  @Input() stats: UserStats | null = null;
  @Input() levelProgress: LevelProgress | null = null;
  @Input() compact: boolean = false;
}
