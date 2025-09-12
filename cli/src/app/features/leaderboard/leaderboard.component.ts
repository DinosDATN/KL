import { Component, OnInit, computed, signal, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LeaderboardService, LeaderboardRow } from '../../core/services/leaderboard.service';
import { User, UserProfile, UserStat } from '../../core/models/user.model';
import {
  LeaderboardEntry,
  Level,
  Badge,
  UserBadge,
} from '../../core/models/gamification.model';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // API data
  leaderboardData = signal<LeaderboardRow[]>([]);
  levels = signal<Level[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // UI state
  period = signal<'weekly' | 'monthly'>('weekly');
  search = signal<string>('');
  sortKey = signal<'xp' | 'level' | 'rank'>('xp');
  sortDir = signal<'desc' | 'asc'>('desc');

  // Derived rows
  rows = computed<LeaderboardRow[]>(() => {
    const data = this.leaderboardData();
    const query = this.search().trim().toLowerCase();

    // Filter by search if provided
    let filteredData = data;
    if (query) {
      filteredData = data.filter(row => 
        row.user.name.toLowerCase().includes(query)
      );
    }

    return filteredData;
  });

  top3 = computed<LeaderboardRow[]>(() => this.rows().slice(0, 3));
  rest = computed<LeaderboardRow[]>(() => this.rows().slice(3));

  constructor(
    public themeService: ThemeService,
    private leaderboardService: LeaderboardService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Only load data in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadLeaderboardData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLeaderboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.leaderboardService.getLeaderboard(
      this.period(),
      50, // limit
      this.search(),
      this.sortKey(),
      this.sortDir()
    )
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    )
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboardData.set(response.data.entries);
          this.levels.set(response.data.levels);
          this.error.set(null);
        } else {
          this.error.set('Failed to load leaderboard data');
        }
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
        this.error.set('An error occurred while loading the leaderboard');
        this.leaderboardData.set([]);
      }
    });
  }

  setPeriod(p: 'weekly' | 'monthly') {
    this.period.set(p);
    this.loadLeaderboardData();
  }
  setSort(key: 'xp' | 'level' | 'rank') {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
    this.loadLeaderboardData();
  }

  getRarityColor(rarity: Badge['rarity']): string {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  }

  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }

  getXpPercent(row: any): string {
    const xp = row.entry?.xp ?? row.stats?.xp ?? 0;
    return Math.min((xp / 5000) * 100, 100) + '%';
  }
  handleSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    // Simple debounce - in a real app you might want to use a proper debounce operator
    setTimeout(() => {
      if (this.search() === value) {
        this.loadLeaderboardData();
      }
    }, 500);
  }
}
