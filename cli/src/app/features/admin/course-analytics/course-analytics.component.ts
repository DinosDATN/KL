import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BaseAdminComponent } from '../base-admin.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AdminCourseService, CourseStats } from '../../../core/services/admin-course.service';
import { NotificationService } from '../../../core/services/notification.service';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: string;
  color: string;
  subtitle?: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

interface TopCourse {
  id: number;
  title: string;
  students: number;
  revenue: number;
  rating: number;
  enrollments: number;
}

interface CategoryStats {
  category: string;
  courses: number;
  students: number;
  revenue: number;
}

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-analytics.component.html',
  styleUrls: ['./course-analytics.component.css']
})
export class CourseAnalyticsComponent extends BaseAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = false;
  error: string | null = null;
  
  // Statistics data
  stats: CourseStats | null = null;
  metricCards: MetricCard[] = [];
  
  // Chart data
  coursesByStatusData: ChartDataPoint[] = [];
  coursesByLevelData: ChartDataPoint[] = [];
  revenueData: ChartDataPoint[] = [];
  enrollmentTrendData: ChartDataPoint[] = [];
  
  // Top courses and categories
  topCourses: TopCourse[] = [];
  topCategories: CategoryStats[] = [];
  
  // Time filter
  timeFilter: 'all' | '7d' | '30d' | '90d' | '1y' = '30d';
  
  // Expose Math for template
  Math = Math;

  constructor(
    private adminCourseService: AdminCourseService,
    private notificationService: NotificationService,
    authService: AuthService,
    router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
  }

  ngOnInit(): void {
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        this.loadAnalytics();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnalytics(): void {
    if (!this.isBrowser) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.adminCourseService.getCourseStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.stats = response.data;
            this.processMetrics();
            this.processChartData();
            this.loading = false;
          } else {
            this.error = response.message || 'Failed to load analytics';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.error = error.error?.message || 'Failed to load analytics';
          this.loading = false;
          this.notificationService.error('Error', this.error || 'Failed to load analytics');
        }
      });
  }

  private processMetrics(): void {
    if (!this.stats) return;

    const growthRate = this.calculateGrowthRate();
    
    this.metricCards = [
      {
        title: 'Total Courses',
        value: this.formatNumber(this.stats.totalCourses),
        change: growthRate,
        changeType: growthRate >= 0 ? 'increase' : 'decrease',
        icon: 'icon-book',
        color: 'blue',
        subtitle: `${this.stats.publishedCourses} published`
      },
      {
        title: 'Total Enrollments',
        value: this.formatNumber(this.stats.totalStudents),
        icon: 'icon-users',
        color: 'green',
        subtitle: 'Active students'
      },
      {
        title: 'Total Revenue',
        value: this.formatCurrency(this.stats.totalRevenue),
        icon: 'icon-trending-up',
        color: 'yellow',
        subtitle: 'All time'
      },
      {
        title: 'Average Rating',
        value: parseFloat(this.stats.averageRating).toFixed(1),
        icon: 'icon-star',
        color: 'purple',
        subtitle: 'Out of 5.0'
      },
      {
        title: 'Published Courses',
        value: this.formatNumber(this.stats.publishedCourses),
        icon: 'icon-check-circle',
        color: 'green',
        subtitle: `${this.calculatePercentage(this.stats.publishedCourses, this.stats.totalCourses)}% of total`
      },
      {
        title: 'Draft Courses',
        value: this.formatNumber(this.stats.draftCourses),
        icon: 'icon-edit',
        color: 'gray',
        subtitle: 'Pending publication'
      },
      {
        title: 'Premium Courses',
        value: this.formatNumber(this.stats.premiumCourses),
        icon: 'icon-star',
        color: 'yellow',
        subtitle: `${this.calculatePercentage(this.stats.premiumCourses, this.stats.totalCourses)}% of total`
      },
      {
        title: 'Free Courses',
        value: this.formatNumber(this.stats.freeCourses),
        icon: 'icon-book',
        color: 'blue',
        subtitle: `${this.calculatePercentage(this.stats.freeCourses, this.stats.totalCourses)}% of total`
      }
    ];
  }

  private processChartData(): void {
    if (!this.stats) return;

    // Courses by status
    this.coursesByStatusData = [
      { label: 'Published', value: this.stats.publishedCourses },
      { label: 'Draft', value: this.stats.draftCourses },
      { label: 'Archived', value: this.stats.archivedCourses },
      { label: 'Deleted', value: this.stats.deletedCourses }
    ];

    // Mock data for other charts (would come from API in real implementation)
    this.coursesByLevelData = [
      { label: 'Beginner', value: Math.floor(this.stats.totalCourses * 0.4) },
      { label: 'Intermediate', value: Math.floor(this.stats.totalCourses * 0.4) },
      { label: 'Advanced', value: Math.floor(this.stats.totalCourses * 0.2) }
    ];

    // Revenue trend (mock data)
    this.revenueData = [
      { label: 'Jan', value: 10000000 },
      { label: 'Feb', value: 12000000 },
      { label: 'Mar', value: 15000000 },
      { label: 'Apr', value: 18000000 },
      { label: 'May', value: 20000000 },
      { label: 'Jun', value: 22000000 }
    ];

    // Enrollment trend (mock data)
    this.enrollmentTrendData = [
      { label: 'Week 1', value: 100 },
      { label: 'Week 2', value: 150 },
      { label: 'Week 3', value: 200 },
      { label: 'Week 4', value: 250 },
      { label: 'Week 5', value: 300 },
      { label: 'Week 6', value: 350 }
    ];

    // Top courses (mock data - would come from API)
    this.topCourses = [
      { id: 1, title: 'Introduction to Programming', students: 5000, revenue: 50000000, rating: 4.8, enrollments: 5200 },
      { id: 2, title: 'Advanced JavaScript', students: 3500, revenue: 35000000, rating: 4.7, enrollments: 3600 },
      { id: 3, title: 'Data Structures & Algorithms', students: 2800, revenue: 28000000, rating: 4.9, enrollments: 2900 }
    ];

    // Top categories (mock data)
    this.topCategories = [
      { category: 'Programming', courses: 45, students: 15000, revenue: 150000000 },
      { category: 'Web Development', courses: 30, students: 12000, revenue: 120000000 },
      { category: 'Data Science', courses: 25, students: 8000, revenue: 80000000 }
    ];
  }

  onTimeFilterChange(): void {
    this.loadAnalytics();
  }

  calculateGrowthRate(): number {
    // Mock calculation - would use historical data in real implementation
    return 12.5;
  }

  calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M VND';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K VND';
    }
    return value.toString() + ' VND';
  }

  getMaxValue(data: ChartDataPoint[]): number {
    if (!data || data.length === 0) return 100;
    return Math.max(...data.map(d => d.value));
  }

  getBarHeight(value: number, maxValue: number): number {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  }

  onExport(format: 'json' | 'csv'): void {
    this.adminCourseService.exportCourses(format, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const filename = `course_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
          this.adminCourseService.downloadExport(blob, filename);
          this.notificationService.success('Success', 'Analytics data exported successfully');
        },
        error: (error) => {
          console.error('Failed to export analytics:', error);
          this.notificationService.error('Error', 'Failed to export analytics data');
        }
      });
  }

  refreshData(): void {
    this.loadAnalytics();
  }
}