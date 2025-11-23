import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CreatorCourseService } from '../../../core/services/creator-course.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-course-content',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-content.component.html',
  styleUrls: ['./course-content.component.css'],
})
export class CourseContentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  courseId: number = 0;
  course: any = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creatorCourseService: CreatorCourseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('CourseContentComponent initialized');
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      console.log('Route params:', params);
      this.courseId = +params['id'];
      console.log('Course ID:', this.courseId);
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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.course = response.data;
          }
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.error(
            'Lỗi',
            'Không thể tải thông tin khóa học'
          );
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/creator/courses']);
  }
}
