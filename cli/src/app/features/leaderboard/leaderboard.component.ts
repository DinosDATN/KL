import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { User, UserProfile, UserStat } from '../../core/models/user.model';
import {
  LeaderboardEntry,
  Level,
  Badge,
  UserBadge,
} from '../../core/models/gamification.model';
import {
  mockLeaderboardUsers,
  mockLeaderboardProfiles,
  mockLeaderboardStats,
  mockLeaderboardEntries,
  mockLevels,
  mockLeaderboardBadges,
  mockLeaderboardUserBadges,
} from '../../core/services/leaderboard-mock-data';

interface LeaderboardRow {
  rank: number;
  user: User;
  profile?: UserProfile;
  stat?: UserStat;
  entry?: LeaderboardEntry;
  level?: Level;
  badges: Badge[];
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit {
  // Mock data
  users: User[] = mockLeaderboardUsers;
  profiles: UserProfile[] = mockLeaderboardProfiles;
  stats: UserStat[] = mockLeaderboardStats;
  entries: LeaderboardEntry[] = mockLeaderboardEntries;
  levels: Level[] = mockLevels;
  badges: Badge[] = mockLeaderboardBadges;
  userBadges: UserBadge[] = mockLeaderboardUserBadges;

  // UI state
  period = signal<'weekly' | 'monthly'>('weekly');
  search = signal<string>('');
  sortKey = signal<'xp' | 'level' | 'rank'>('xp');
  sortDir = signal<'desc' | 'asc'>('desc');

  // Derived rows
  rows = computed<LeaderboardRow[]>(() => {
    const type = this.period();
    const query = this.search().trim().toLowerCase();

    const rows: LeaderboardRow[] = this.users
      .map((u) => {
        const profile = this.profiles.find((p) => p.user_id === u.id);
        const stat = this.stats.find((s) => s.user_id === u.id);
        const entry = this.entries.find(
          (e) => e.user_id === u.id && e.type === type
        );
        const level = stat
          ? this.levels
              .filter((lv) => lv.level <= (stat?.level ?? 0))
              .sort((a, b) => b.level - a.level)[0]
          : undefined;
        const badges = this.userBadges
          .filter((ub) => ub.user_id === u.id)
          .map((ub) => this.badges.find((b) => b.id === ub.badge_id))
          .filter((b): b is Badge => !!b);

        return {
          rank: stat?.rank ?? 9999,
          user: u,
          profile,
          stat,
          entry,
          level,
          badges,
        };
      })
      // filter by search
      .filter((r) => !query || r.user.name.toLowerCase().includes(query))
      // sort by selected key
      .sort((a, b) => {
        const dir = this.sortDir() === 'desc' ? -1 : 1;
        const key = this.sortKey();
        let va = 0,
          vb = 0;
        if (key === 'xp') {
          va = a.entry?.xp ?? a.stat?.xp ?? 0;
          vb = b.entry?.xp ?? b.stat?.xp ?? 0;
        } else if (key === 'level') {
          va = a.stat?.level ?? 0;
          vb = b.stat?.level ?? 0;
        } else if (key === 'rank') {
          va = a.stat?.rank ?? 9999;
          vb = b.stat?.rank ?? 9999;
        }
        if (va === vb) return a.user.id - b.user.id; // stable
        return va < vb ? 1 * dir : -1 * dir;
      })
      // re-assign ranks based on sort if using xp/level
      .map((r, i) => ({ ...r, rank: i + 1 }));

    return rows;
  });

  top3 = computed<LeaderboardRow[]>(() => this.rows().slice(0, 3));
  rest = computed<LeaderboardRow[]>(() => this.rows().slice(3));

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {}

  setPeriod(p: 'weekly' | 'monthly') {
    this.period.set(p);
  }
  setSort(key: 'xp' | 'level' | 'rank') {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('desc');
    }
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
    const xp = row.entry?.xp ?? row.stat?.xp ?? 0;
    return Math.min((xp / 5000) * 100, 100) + '%';
  }
  handleSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
  }
}
