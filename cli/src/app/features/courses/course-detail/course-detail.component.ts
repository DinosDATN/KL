import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Course, CourseCategory } from '../../../core/models/course.model';
import { CourseModule, CourseLesson, CourseReview } from '../../../core/models/course-module.model';
import { User } from '../../../core/models/user.model';
import { CoursesService } from '../../../core/services/courses.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CourseCardComponent } from '../components/course-card/course-card.component';
import { LessonViewerComponent } from '../components/lesson-viewer/lesson-viewer.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CourseCardComponent, LessonViewerComponent],
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
  hasPendingPayment: boolean = false;
  pendingPayment: any = null;
  
  // Review form properties
  reviewRating: number = 0;
  reviewComment: string = '';
  isSubmittingReview: boolean = false;
  showReviewForm: boolean = false;
  userReview: CourseReview | null = null;
  currentUser: User | null = null;
  
  private destroy$ = new Subject<void>();
  
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    
    // Get current user if authenticated
    if (this.isAuthenticated) {
      this.currentUser = this.authService.getCurrentUser();
      
      // Subscribe to user changes
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe((user: User | null) => {
          this.currentUser = user;
          // Recheck user review when user changes
          if (user && this.courseReviews.length > 0) {
            this.checkUserReview();
          }
        });
    }
    
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
          this.courseReviews = data.reviews || [];
          
          // Find user's existing review after reviews are loaded
          this.checkUserReview();
          
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
    // Kiểm tra cả enrollment và payment status
    this.coursesService.checkEnrollment(courseId).subscribe({
      next: (response: any) => {
        this.isEnrolled = response.data.isEnrolled;
        this.hasPendingPayment = response.data.hasPendingPayment || false;
        this.pendingPayment = response.data.pendingPayment || null;
        
        // Log để debug
        console.log('Enrollment status:', {
          isEnrolled: this.isEnrolled,
          hasPendingPayment: this.hasPendingPayment,
          pendingPayment: this.pendingPayment
        });
      },
      error: (error) => {
        console.error('Error checking enrollment:', error);
      }
    });
  }

  // Method để refresh enrollment status (có thể gọi từ các component khác)
  refreshEnrollmentStatus(): void {
    if (this.course?.id) {
      this.checkEnrollmentStatus(this.course.id);
    }
  }

  onEnrollClick(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/courses/${this.course?.id}` }
      });
      return;
    }

    if (!this.course) return;

    // Kiểm tra nếu đã có payment đang pending
    if (this.hasPendingPayment) {
      this.notificationService.info(
        'Đang chờ xác nhận thanh toán',
        'Bạn đã có một thanh toán đang chờ xác nhận cho khóa học này. Vui lòng chờ giảng viên xác nhận.'
      );
      return;
    }

    // Kiểm tra nếu khóa học có phí
    const coursePrice = this.course.price || this.course.original_price || 0;
    if (coursePrice > 0) {
      // Hiển thị thông báo và chuyển đến trang thanh toán
      this.notificationService.info(
        'Khóa học có phí',
        `Khóa học này có phí ${this.formatPrice(coursePrice)}. Đang chuyển đến trang thanh toán...`
      );
      this.router.navigate(['/courses', this.course.id, 'payment']);
      return;
    }

    // Khóa học miễn phí - đăng ký trực tiếp
    this.isEnrolling = true;
    this.coursesService.enrollCourse(this.course.id).subscribe({
      next: (response: any) => {
        this.isEnrolled = true;
        this.isEnrolling = false;
        this.hasPendingPayment = false; // Reset pending payment status
        this.notificationService.success(
          'Đăng ký thành công',
          'Bạn đã đăng ký khóa học thành công! Bây giờ bạn có thể bắt đầu học hoặc đánh giá khóa học.'
        );
      },
      error: (error: any) => {
        this.isEnrolling = false;
        
        if (error.status === 402) {
          this.router.navigate(['/courses', this.course?.id, 'payment']);
        } else if (error.message.includes('already enrolled')) {
          this.isEnrolled = true;
          this.hasPendingPayment = false;
        } else if (error.message.includes('pending payment')) {
          // Cập nhật trạng thái pending payment
          this.hasPendingPayment = true;
          this.notificationService.info(
            'Đang chờ xác nhận thanh toán',
            'Bạn đã có một thanh toán đang chờ xác nhận cho khóa học này. Xem chi tiết trong trang cá nhân.'
          );
          // Redirect to profile with courses tab after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/profile'], { fragment: 'courses' });
          }, 2000);
        } else {
          this.notificationService.error(
            'Đăng ký thất bại',
            error.message || 'Có lỗi xảy ra khi đăng ký khóa học. Vui lòng thử lại.'
          );
        }
      }
    });
  }

  startLearning(): void {
    if (!this.isEnrolled) {
      // Hiển thị thông báo thay vì chuyển trang
      this.notificationService.warning(
        'Chưa đăng ký khóa học',
        'Bạn cần đăng ký khóa học trước khi có thể bắt đầu học. Vui lòng nhấn nút "Đăng ký khóa học" để tiếp tục.'
      );
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
    if (!this.isEnrolled) {
      // Hiển thị thông báo thay vì chuyển trang
      this.notificationService.warning(
        'Chưa đăng ký khóa học',
        'Bạn cần đăng ký khóa học trước khi có thể xem bài học. Vui lòng nhấn nút "Đăng ký khóa học" để tiếp tục.'
      );
      return;
    }
    
    // Navigate to lesson learning page
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

  // Review methods
  toggleReviewForm(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/courses/${this.course?.id}` }
      });
      return;
    }
    
    if (!this.isEnrolled) {
      // Show a more helpful message
      this.notificationService.info(
        'Cần đăng ký khóa học',
        'Chỉ những học viên đã đăng ký khóa học mới có thể đánh giá. Vui lòng đăng ký khóa học trước.'
      );
      this.onEnrollClick();
      return;
    }
    
    this.showReviewForm = !this.showReviewForm;
  }

  setRating(rating: number): void {
    this.reviewRating = rating;
  }

  submitReview(): void {
    if (!this.course || !this.isAuthenticated || !this.isEnrolled) {
      this.notificationService.warning(
        'Cần đăng ký khóa học',
        'Bạn cần đăng ký khóa học trước khi đánh giá!'
      );
      return;
    }

    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.notificationService.warning(
        'Đánh giá không hợp lệ',
        'Vui lòng chọn số sao đánh giá từ 1 đến 5!'
      );
      return;
    }

    this.isSubmittingReview = true;
    
    this.coursesService.submitReview(
      this.course.id,
      this.reviewRating,
      this.reviewComment.trim() || undefined
    ).subscribe({
      next: (response: any) => {
        this.isSubmittingReview = false;
        this.showReviewForm = false;
        
        // Handle response - could be direct data or wrapped in response object
        const reviewData = response.data || response;
        const averageRating = response.average_rating !== undefined ? response.average_rating : (response.data?.average_rating);
        
        // Update user review from response
        if (reviewData) {
          const newReview = reviewData;
          this.userReview = newReview;
          this.reviewRating = newReview.rating;
          this.reviewComment = newReview.comment || '';
          
          // Update reviews list immediately
          const existingIndex = this.courseReviews.findIndex(r => 
            (r.id && newReview.id && r.id === newReview.id) || 
            (r.user_id === this.currentUser?.id && newReview.user_id === this.currentUser?.id)
          );
          
          if (existingIndex >= 0) {
            // Update existing review in place
            this.courseReviews[existingIndex] = { ...this.courseReviews[existingIndex], ...newReview };
          } else {
            // Add new review at the beginning (most recent first)
            this.courseReviews = [newReview, ...this.courseReviews];
          }
          
          // Re-sort reviews by helpful count (DESC) then created_at (DESC) to match backend
          this.courseReviews.sort((a, b) => {
            const helpfulDiff = (b.helpful || 0) - (a.helpful || 0);
            if (helpfulDiff !== 0) return helpfulDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          // Update course rating if provided
          if (averageRating !== undefined && this.course) {
            this.course.rating = averageRating;
          }
        }
        
        // Show success message
        const message = response.message || 'Đánh giá của bạn đã được gửi thành công!';
        this.notificationService.success(
          'Đánh giá thành công',
          message
        );
      },
      error: (error: any) => {
        this.isSubmittingReview = false;
        console.error('Error submitting review:', error);
        
        // Handle specific error cases
        let errorMessage = 'Đã có lỗi xảy ra khi gửi đánh giá';
        
        if (error.status === 403 || error.message?.includes('enrolled') || error.message?.includes('must be enrolled')) {
          errorMessage = 'Bạn cần đăng ký khóa học trước khi có thể đánh giá. Vui lòng đăng ký khóa học và thử lại.';
          this.isEnrolled = false; // Update enrollment status
        } else if (error.status === 401) {
          errorMessage = 'Vui lòng đăng nhập để đánh giá khóa học.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error(
          'Lỗi đánh giá',
          errorMessage
        );
      }
    });
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  hasUserReviewed(): boolean {
    return this.userReview !== null;
  }

  getUserReview(): CourseReview | null {
    return this.userReview;
  }

  checkUserReview(): void {
    if (this.currentUser && this.courseReviews.length > 0) {
      this.userReview = this.courseReviews.find(r => r.user_id === this.currentUser?.id) || null;
      if (this.userReview) {
        this.reviewRating = this.userReview.rating;
        this.reviewComment = this.userReview.comment || '';
      }
    }
  }

}
