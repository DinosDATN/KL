import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CreatorCourseService } from '../../../core/services/creator-course.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface CourseAnalytics {
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  enrollmentTrend: { date: string; count: number }[];
  revenueTrend: { date: string; amount: number }[];
  topLessons: { title: string; views: number }[];
}

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-analytics.component.html',
  styleUrls: ['./course-analytics.component.css'],
})
export class CourseAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  courseId: number = 0;
  course: any = null;
  analytics: CourseAnalytics | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private creatorCourseService: CreatorCourseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.courseId = +params['id'];
      this.loadCourse();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourse(): void {
    this.loading = true;
    this.creatorCourseService
      .getMyCourse(this.courseId)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.course = response.data;
            // Sau khi có course thì mới tính analytics để tránh dữ liệu 0
            this.loadAnalytics();
          }
        },
        error: () => {
          this.notificationService.error(
            'Lỗi',
            'Không thể tải thông tin khóa học'
          );
        },
      });
  }

  loadAnalytics(): void {
    // Mock data for now - replace with actual API call
    this.analytics = {
      totalStudents: this.course?.students || 0,
      totalRevenue: this.course?.price ? this.course.price * (this.course.students || 0) : 0,
      averageRating: this.course?.rating || 0,
      totalReviews: 0,
      completionRate: 0,
      enrollmentTrend: [],
      revenueTrend: [],
      topLessons: []
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  goBack(): void {
    this.router.navigate(['/creator/courses']);
  }
}
