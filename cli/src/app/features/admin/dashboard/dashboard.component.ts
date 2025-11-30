import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AdminService, DashboardStats } from '../../../core/services/admin.service';
import { ThemeService } from '../../../core/services/theme.service';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading = true;
  error: string | null = null;
  
  // Dashboard data
  dashboardStats: DashboardStats | null = null;
  metricCards: MetricCard[] = [];
  
  // Chart data
  userGrowthData: ChartData = { labels: [], datasets: [] };
  revenueData: ChartData = { labels: [], datasets: [] };
  coursePopularityData: ChartData = { labels: [], datasets: [] };
  
  // Recent activity
  recentActivities: any[] = [];
  
  // System health
  systemHealth: any = null;
  
  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.error = null;

    // Load all dashboard data
    forkJoin({
      dashboard: this.adminService.getDashboardStats(),
      userStats: this.adminService.getUserStatistics(),
      courseStats: this.adminService.getCourseStatistics(),
      problemStats: this.adminService.getProblemStatistics()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.dashboardStats = data.dashboard;
        this.processMetricCards(data);
        this.processChartData(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = error.message || 'Failed to load dashboard data';
        this.isLoading = false;
      }
    });
  }

  private processMetricCards(data: any) {
    const stats = data.dashboard;
    
    this.metricCards = [
      {
        title: 'Total Users',
        value: this.formatNumber(stats.totalUsers),
        change: this.calculateGrowthRate(data.userStats.growthRate || 0),
        changeType: data.userStats.growthRate >= 0 ? 'increase' : 'decrease',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
        color: 'blue'
      },
      {
        title: 'Active Users',
        value: this.formatNumber(stats.activeUsers),
        change: Math.round((stats.activeUsers / stats.totalUsers) * 100),
        changeType: 'increase',
        icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
        color: 'green'
      },
      {
        title: 'Total Courses',
        value: this.formatNumber(stats.totalCourses),
        change: this.calculateGrowthRate(data.courseStats.growthRate || 0),
        changeType: data.courseStats.growthRate >= 0 ? 'increase' : 'decrease',
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        color: 'purple'
      },
      {
        title: 'Problems',
        value: this.formatNumber(stats.totalProblems),
        change: this.calculateGrowthRate(data.problemStats.growthRate || 0),
        changeType: data.problemStats.growthRate >= 0 ? 'increase' : 'decrease',
        icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        color: 'orange'
      },
      {
        title: 'Total Revenue',
        value: this.formatCurrency(stats.totalRevenue),
        change: this.calculateGrowthRate(data.dashboard.revenueGrowthRate || 0),
        changeType: data.dashboard.revenueGrowthRate >= 0 ? 'increase' : 'decrease',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        color: 'emerald'
      },
      {
        title: 'System Health',
        value: this.capitalizeFirst(stats.systemHealth.status),
        change: Math.round(stats.systemHealth.uptime / 24),
        changeType: 'increase',
        icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
        color: stats.systemHealth.status === 'healthy' ? 'green' : stats.systemHealth.status === 'warning' ? 'yellow' : 'red'
      }
    ];
  }

  private processChartData(data: any) {
    const stats = data.dashboard;
    
    // User growth chart
    if (stats.userGrowth && stats.userGrowth.length > 0) {
      this.userGrowthData = {
        labels: stats.userGrowth.map((item: any) => this.formatDate(item.date)),
        datasets: [
          {
            label: 'New Users',
            data: stats.userGrowth.map((item: any) => item.users),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      };
    }

    // Course popularity chart
    if (stats.topCourses && stats.topCourses.length > 0) {
      this.coursePopularityData = {
        labels: stats.topCourses.map((course: any) => this.truncateText(course.title, 20)),
        datasets: [
          {
            label: 'Students Enrolled',
            data: stats.topCourses.map((course: any) => course.students),
            backgroundColor: [
              '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', 
              '#ef4444', '#06b6d4', '#84cc16', '#f97316'
            ].slice(0, stats.topCourses.length),
            borderWidth: 0
          }
        ]
      };
    }

    // Revenue data (mock for now, would come from API)
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    this.revenueData = {
      labels: last7Days,
      datasets: [
        {
          label: 'Daily Revenue',
          data: [12000, 15000, 8000, 22000, 18000, 25000, 30000], // Mock data
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }


  // Utility methods
  private formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  private calculateGrowthRate(rate: number): number {
    return Math.round(Math.abs(rate));
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  }

  private getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'user_registered': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'course_created': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      'problem_solved': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
      'payment_received': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[type] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  onRefreshData() {
    this.loadDashboardData();
  }
  
  // Helper methods for template calculations
  getMaxValue(data: number[]): number {
    return Math.max(...data);
  }
  
  calculateBarHeight(value: number, data: number[], maxHeight: number = 200): number {
    const max = this.getMaxValue(data);
    return max > 0 ? (value / max) * maxHeight : 0;
  }
}