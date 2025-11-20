import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AdminService } from '../../../core/services/admin.service';
import { ThemeService } from '../../../core/services/theme.service';

interface ChartData {
  labels: string[];
  datasets: any[];
}

interface OverviewData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    retentionRate: number;
    enrollments: number;
    submissions: number;
    completedCourses: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    activityByDay: Array<{ day: number; count: number }>;
    activityByHour: Array<{ hour: number; count: number }>;
  };
  distribution: {
    byRole: Array<{ role: string; count: number }>;
    bySubscription: Array<{ subscription: string; count: number }>;
  };
}

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-analytics.component.html',
  styleUrls: ['./user-analytics.component.css']
})
export class UserAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = true;
  error: string | null = null;

  // Date range selector
  selectedRange: '7d' | '30d' | '90d' | '1y' = '30d';
  selectedCohort: 'weekly' | 'monthly' = 'monthly';
  activeTab: 'overview' | 'engagement' | 'retention' | 'behavior' | 'time' = 'overview';

  // Overview data
  overviewData: OverviewData | null = null;
  userGrowthChart: ChartData = { labels: [], datasets: [] };
  activityByDayChart: ChartData = { labels: [], datasets: [] };
  activityByHourChart: ChartData = { labels: [], datasets: [] };
  roleDistributionChart: ChartData = { labels: [], datasets: [] };
  subscriptionDistributionChart: ChartData = { labels: [], datasets: [] };

  // Engagement data
  engagementData: any = null;
  dailyActiveUsersChart: ChartData = { labels: [], datasets: [] };
  enrollmentTrendsChart: ChartData = { labels: [], datasets: [] };
  submissionTrendsChart: ChartData = { labels: [], datasets: [] };

  // Retention data
  retentionData: any = null;

  // Behavior data
  behaviorData: any = null;

  // Time-based data
  timeBasedData: any = null;

  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadOverviewData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRangeChange(range: '7d' | '30d' | '90d' | '1y') {
    this.selectedRange = range;
    this.loadDataForTab();
  }

  onCohortChange(cohort: 'weekly' | 'monthly') {
    this.selectedCohort = cohort;
    if (this.activeTab === 'retention') {
      this.loadRetentionData();
    }
  }

  onTabChange(tab: 'overview' | 'engagement' | 'retention' | 'behavior' | 'time') {
    this.activeTab = tab;
    this.loadDataForTab();
  }

  loadDataForTab() {
    switch (this.activeTab) {
      case 'overview':
        this.loadOverviewData();
        break;
      case 'engagement':
        this.loadEngagementData();
        break;
      case 'retention':
        this.loadRetentionData();
        break;
      case 'behavior':
        this.loadBehaviorData();
        break;
      case 'time':
        this.loadTimeBasedData();
        break;
    }
  }

  loadOverviewData() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getUserAnalyticsOverview(this.selectedRange)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.overviewData = data;
          this.processOverviewData(data);
        },
        error: (error) => {
          console.error('Error loading overview data:', error);
          this.error = error.message || 'Failed to load overview data';
        }
      });
  }

  loadEngagementData() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getUserEngagementMetrics(this.selectedRange as '7d' | '30d' | '90d')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.engagementData = data;
          this.processEngagementData(data);
        },
        error: (error) => {
          console.error('Error loading engagement data:', error);
          this.error = error.message || 'Failed to load engagement data';
        }
      });
  }

  loadRetentionData() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getUserRetentionAnalysis(this.selectedCohort)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.retentionData = data;
        },
        error: (error) => {
          console.error('Error loading retention data:', error);
          this.error = error.message || 'Failed to load retention data';
        }
      });
  }

  loadBehaviorData() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getUserBehaviorInsights(this.selectedRange as '7d' | '30d' | '90d')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.behaviorData = data;
        },
        error: (error) => {
          console.error('Error loading behavior data:', error);
          this.error = error.message || 'Failed to load behavior data';
        }
      });
  }

  loadTimeBasedData() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getTimeBasedAnalytics(this.selectedRange as '7d' | '30d' | '90d')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.timeBasedData = data;
          this.processTimeBasedData(data);
        },
        error: (error) => {
          console.error('Error loading time-based data:', error);
          this.error = error.message || 'Failed to load time-based data';
        }
      });
  }

  private processOverviewData(data: OverviewData) {
    // User growth chart
    if (data.trends.userGrowth && data.trends.userGrowth.length > 0) {
      this.userGrowthChart = {
        labels: data.trends.userGrowth.map(item => this.formatDate(item.date)),
        datasets: [{
          label: 'New Users',
          data: data.trends.userGrowth.map(item => item.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Activity by day chart
    if (data.trends.activityByDay && data.trends.activityByDay.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      this.activityByDayChart = {
        labels: data.trends.activityByDay
          .sort((a, b) => a.day - b.day)
          .map(item => dayNames[item.day - 1] || `Day ${item.day}`),
        datasets: [{
          label: 'Activity',
          data: data.trends.activityByDay
            .sort((a, b) => a.day - b.day)
            .map(item => item.count),
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          borderWidth: 1
        }]
      };
    }

    // Activity by hour chart
    if (data.trends.activityByHour && data.trends.activityByHour.length > 0) {
      this.activityByHourChart = {
        labels: data.trends.activityByHour.map(item => `${item.hour}:00`),
        datasets: [{
          label: 'Activity',
          data: data.trends.activityByHour.map(item => item.count),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Role distribution chart
    if (data.distribution.byRole && data.distribution.byRole.length > 0) {
      this.roleDistributionChart = {
        labels: data.distribution.byRole.map(item => item.role),
        datasets: [{
          label: 'Users',
          data: data.distribution.byRole.map(item => item.count),
          backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }]
      };
    }

    // Subscription distribution chart
    if (data.distribution.bySubscription && data.distribution.bySubscription.length > 0) {
      this.subscriptionDistributionChart = {
        labels: data.distribution.bySubscription.map(item => item.subscription),
        datasets: [{
          label: 'Users',
          data: data.distribution.bySubscription.map(item => item.count),
          backgroundColor: ['#10b981', '#f59e0b'],
          borderWidth: 0
        }]
      };
    }
  }

  private processEngagementData(data: any) {
    // Daily active users chart
    if (data.dailyActiveUsers && data.dailyActiveUsers.length > 0) {
      this.dailyActiveUsersChart = {
        labels: data.dailyActiveUsers.map((item: any) => this.formatDate(item.date)),
        datasets: [{
          label: 'Daily Active Users',
          data: data.dailyActiveUsers.map((item: any) => item.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Enrollment trends chart
    if (data.enrollmentTrends && data.enrollmentTrends.length > 0) {
      this.enrollmentTrendsChart = {
        labels: data.enrollmentTrends.map((item: any) => this.formatDate(item.date)),
        datasets: [{
          label: 'Enrollments',
          data: data.enrollmentTrends.map((item: any) => item.count),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Submission trends chart
    if (data.submissionTrends && data.submissionTrends.length > 0) {
      this.submissionTrendsChart = {
        labels: data.submissionTrends.map((item: any) => this.formatDate(item.date)),
        datasets: [
          {
            label: 'Total Submissions',
            data: data.submissionTrends.map((item: any) => item.count),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Accepted',
            data: data.submissionTrends.map((item: any) => item.accepted || 0),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      };
    }
  }

  private processTimeBasedData(data: any) {
    // Process time-based charts if needed
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  calculateBarHeight(value: number, data: number[]): number {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data);
    if (max === 0) return 0;
    return (value / max) * 240; // Max height 240px
  }

  calculateLineHeight(value: number, data: number[]): number {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data);
    if (max === 0) return 0;
    return (value / max) * 240;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day - 1] || `Day ${day}`;
  }
}
