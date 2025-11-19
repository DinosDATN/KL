import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Course, CourseCategory } from '../../../core/models/course.model';
import { CourseModule, CourseLesson, CourseReview } from '../../../core/models/course-module.model';
import { User } from '../../../core/models/user.model';
import { CoursesService } from '../../../core/services/courses.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseCardComponent } from '../components/course-card/course-card.component';
import { LessonViewerComponent } from '../components/lesson-viewer/lesson-viewer.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, CourseCardComponent, LessonViewerComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css'
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  course: Course | null = null;
  instructor: User | null = null;
  category: CourseCategory | null = null;
  courseModules: CourseModule[] = [];
  courseLessons: CourseLesson[] = [];
  relatedCourses: Course[] = [];
  courseReviews: CourseReview[] = [];
  selectedLesson: CourseLesson | null = null;
  
  loading = true;
  error: string | null = null;
  
  isEnrolled: boolean = false;
  isEnrolling: boolean = false;
  isAuthenticated: boolean = false;
  
  private destroy$ = new Subject<void>();
  
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    
    this.route.paramMap.subscribe(params => {
      const courseId = Number(params.get('id'));
      if (courseId) {
        this.loadCourseDetail(courseId);
        if (this.isAuthenticated) {
          this.checkEnrollmentStatus(courseId);
        }
      } else {
        this.router.navigate(['/courses']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadCourseDetail(courseId: number): void {
    this.loading = true;
    this.error = null;
    
    this.coursesService.getCourseDetails(courseId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          this.course = data.course;
          this.instructor = data.instructor;
          this.category = data.category;
          this.courseModules = data.modules;
          this.courseLessons = data.lessons;
          this.relatedCourses = data.relatedCourses;
          this.courseReviews = data.reviews;
          
          // Select first lesson by position if available
          this.selectedLesson = this.courseLessons.sort((a,b) => (a.position||0) - (b.position||0))[0] || null;
        },
        error: (error) => {
          console.error('Failed to load course details:', error);
          this.error = error.message;
        }
      });
  }

  checkEnrollmentStatus(courseId: number): void {
    this.coursesService.checkEnrollment(courseId).subscribe({
      next: (response: any) => {
        this.isEnrolled = response.data.isEnrolled;
      },
      error: (error) => {
        console.error('Error checking enrollment:', error);
      }
    });
  }

  onEnrollClick(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/courses/${this.course?.id}` }
      });
      return;
    }

    if (!this.course) return;

    // Kiểm tra nếu khóa học có phí
    const coursePrice = this.course.price || this.course.original_price || 0;
    if (coursePrice > 0) {
      // Hiển thị thông báo và chuyển đến trang thanh toán
      if (confirm(`Khóa học này có phí ${this.formatPrice(coursePrice)}. Bạn có muốn tiếp tục thanh toán?`)) {
        this.router.navigate(['/courses', this.course.id, 'payment']);
      }
      return;
    }

    // Khóa học miễn phí - đăng ký trực tiếp
    this.isEnrolling = true;
    this.coursesService.enrollCourse(this.course.id).subscribe({
      next: (response: any) => {
        this.isEnrolled = true;
        this.isEnrolling = false;
        alert('Đăng ký khóa học thành công!');
        this.startLearning();
      },
      error: (error: any) => {
        this.isEnrolling = false;
        
        if (error.status === 402) {
          this.router.navigate(['/courses', this.course?.id, 'payment']);
        } else if (error.message.includes('already enrolled')) {
          this.isEnrolled = true;
          this.startLearning();
        } else {
          alert('Đăng ký thất bại: ' + error.message);
        }
      }
    });
  }

  startLearning(): void {
    if (!this.isEnrolled) {
      this.onEnrollClick();
      return;
    }
    
    this.router.navigate(['/courses', this.course?.id, 'learn']);
  }

  onRelatedCourseClick(course: Course): void {
    this.router.navigate(['/courses', course.id]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  formatDuration(duration: number | null | undefined): string {
    if (!duration) return 'N/A';
    return duration === 1 ? '1 giờ' : `${duration} giờ`;
  }

  generateStarsArray(rating: number): number[] {
    return Array.from({length: 5}, (_, i) => i + 1);
  }

  getTotalLessons(): number {
    return this.courseLessons.length;
  }

  getTotalDuration(): number {
    return this.courseLessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }

  getCourseReviews() {
    return this.courseReviews;
  }

  getAverageRating(): number {
    const reviews = this.getCourseReviews();
    if (reviews.length === 0) return this.course?.rating || 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }

  getModuleLessons(moduleId: number): CourseLesson[] {
    return this.courseLessons.filter(lesson => lesson.module_id === moduleId)
      .sort((a,b) => (a.position || 0) - (b.position || 0));
  }

  selectLesson(lesson: CourseLesson): void {
    // Navigate to lesson learning page instead of showing inline
    this.router.navigate(['/courses', this.course?.id, 'lessons', lesson.id]);
  }

  getInstructorName(instructorId: number): string {
    // For related courses, we'll load the instructor name from the instructor data
    // This is a simple implementation - in a more complex system, you might want to cache instructor data
    if (this.instructor && this.instructor.id === instructorId) {
      return this.instructor.name;
    }
    
    // If we don't have the instructor data, we'll need to make an API call or return a default
    // For now, we'll return a placeholder and let the course card handle the display
    return 'Loading...';
  }

}
