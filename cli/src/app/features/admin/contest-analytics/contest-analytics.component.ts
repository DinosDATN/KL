import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AdminService, ContestStats } from '../../../core/services/admin.service';
import { ThemeService } from '../../../core/services/theme.service';

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-contest-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contest-analytics.component.html',
  styleUrls: ['./contest-analytics.component.css']
})
export class ContestAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = true;
  error: string | null = null;

  // Date range selector
  selectedRange: '7d' | '30d' | '90d' | 'all' = '30d';

  // Statistics data
  stats: ContestStats | null = null;

  // Chart data
  contestCreationChart: ChartData = { labels: [], datasets: [] };
  participationChart: ChartData = { labels: [], datasets: [] };
  submissionChart: ChartData = { labels: [], datasets: [] };
  submissionsByStatusChart: ChartData = { labels: [], datasets: [] };
  submissionsByLanguageChart: ChartData = { labels: [], datasets: [] };

  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRangeChange(range: '7d' | '30d' | '90d' | 'all') {
    this.selectedRange = range;
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getContestStatistics(this.selectedRange)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.processChartData(data);
        },
        error: (err) => {
          console.error('Error loading contest analytics:', err);
          this.error = err.message || 'Failed to load contest analytics';
        }
      });
  }

  private processChartData(data: ContestStats) {
    // Contest creation trend chart
    if (data.contestCreationTrend && data.contestCreationTrend.length > 0) {
      this.contestCreationChart = {
        labels: data.contestCreationTrend.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Contests Created',
          data: data.contestCreationTrend.map(item => item.count),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      };
    }

    // Participation trend chart
    if (data.participationTrend && data.participationTrend.length > 0) {
      this.participationChart = {
        labels: data.participationTrend.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Participants',
          data: data.participationTrend.map(item => item.count),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2
        }]
      };
    }

    // Submission trend chart
    if (data.submissionTrend && data.submissionTrend.length > 0) {
      this.submissionChart = {
        labels: data.submissionTrend.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Submissions',
          data: data.submissionTrend.map(item => item.count),
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 2
        }]
      };
    }

    // Submissions by status chart
    if (data.submissionsByStatus && data.submissionsByStatus.length > 0) {
      const statusColors: { [key: string]: string } = {
        'accepted': 'rgba(16, 185, 129, 0.5)',
        'wrong': 'rgba(239, 68, 68, 0.5)',
        'error': 'rgba(245, 158, 11, 0.5)'
      };
      const statusBorderColors: { [key: string]: string } = {
        'accepted': 'rgba(16, 185, 129, 1)',
        'wrong': 'rgba(239, 68, 68, 1)',
        'error': 'rgba(245, 158, 11, 1)'
      };

      this.submissionsByStatusChart = {
        labels: data.submissionsByStatus.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
        datasets: [{
          label: 'Submissions',
          data: data.submissionsByStatus.map(item => item.count),
          backgroundColor: data.submissionsByStatus.map(item => statusColors[item.status] || 'rgba(156, 163, 175, 0.5)'),
          borderColor: data.submissionsByStatus.map(item => statusBorderColors[item.status] || 'rgba(156, 163, 175, 1)'),
          borderWidth: 2
        }]
      };
    }

    // Submissions by language chart
    if (data.submissionsByLanguage && data.submissionsByLanguage.length > 0) {
      const languageColors = [
        'rgba(59, 130, 246, 0.5)',
        'rgba(16, 185, 129, 0.5)',
        'rgba(139, 92, 246, 0.5)',
        'rgba(236, 72, 153, 0.5)',
        'rgba(245, 158, 11, 0.5)'
      ];
      const languageBorderColors = [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(245, 158, 11, 1)'
      ];

      this.submissionsByLanguageChart = {
        labels: data.submissionsByLanguage.map(item => item.language),
        datasets: [{
          label: 'Submissions',
          data: data.submissionsByLanguage.map(item => item.count),
          backgroundColor: languageColors.slice(0, data.submissionsByLanguage.length),
          borderColor: languageBorderColors.slice(0, data.submissionsByLanguage.length),
          borderWidth: 2
        }]
      };
    }
  }

  calculateBarHeight(value: number, data: number[]): number {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data);
    if (max === 0) return 0;
    return (value / max) * 200; // Max height 200px
  }

  getMaxValue(data: number[]): number {
    if (!data || data.length === 0) return 0;
    return Math.max(...data);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  getInitial(name: string | undefined | null): string {
    if (!name || name.length === 0) {
      return 'U';
    }
    return name.charAt(0).toUpperCase();
  }
}
