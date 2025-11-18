# Hướng Dẫn Tích Hợp Frontend với Hệ Thống Enrollment

## Tổng Quan

Tài liệu này hướng dẫn cách cập nhật Angular frontend để tích hợp với hệ thống enrollment mới.

## 1. Cập Nhật Course Service

### Thêm các methods mới vào `courses.service.ts`

```typescript
// cli/src/app/core/services/courses.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private apiUrl = `${environment.apiUrl}/courses`;
  private enrollmentUrl = `${environment.apiUrl}/course-enrollments`;

  constructor(private http: HttpClient) {}

  // Existing methods...

  // ============ ENROLLMENT METHODS ============

  /**
   * Enroll in a course
   */
  enrollCourse(courseId: number): Observable<any> {
    return this.http.post(
      `${this.enrollmentUrl}/${courseId}/enroll`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Check if user is enrolled in a course
   */
  checkEnrollment(courseId: number): Observable<any> {
    return this.http.get(
      `${this.enrollmentUrl}/${courseId}/check`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Get user's enrollments
   */
  getMyEnrollments(status?: string): Observable<any> {
    let url = `${this.enrollmentUrl}/my-enrollments`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get course progress
   */
  getCourseProgress(courseId: number): Observable<any> {
    return this.http.get(
      `${this.enrollmentUrl}/${courseId}/progress`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Mark lesson as complete
   */
  completeLesson(courseId: number, lessonId: number, timeSpent: number): Observable<any> {
    return this.http.post(
      `${this.enrollmentUrl}/${courseId}/lessons/${lessonId}/complete`,
      { timeSpent },
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Get learning dashboard
   */
  getLearningDashboard(): Observable<any> {
    return this.http.get(
      `${this.enrollmentUrl}/dashboard`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Get auth headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}
```

## 2. Cập Nhật Course Detail Component

### Thêm enrollment logic vào `course-detail.component.ts`

```typescript
// cli/src/app/features/courses/course-detail/course-detail.component.ts

export class CourseDetailComponent implements OnInit {
  course: any = null;
  isEnrolled: boolean = false;
  enrollment: any = null;
  isLoading: boolean = true;
  isEnrolling: boolean = false;
  isAuthenticated: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService,
    private authService: AuthService // Inject your auth service
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    
    this.route.params.subscribe(params => {
      const courseId = +params['id'];
      this.loadCourseDetails(courseId);
      
      if (this.isAuthenticated) {
        this.checkEnrollmentStatus(courseId);
      }
    });
  }

  loadCourseDetails(courseId: number): void {
    this.isLoading = true;
    this.coursesService.getCourseDetails(courseId).subscribe({
      next: (response) => {
        this.course = response.data.course;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.isLoading = false;
      }
    });
  }

  checkEnrollmentStatus(courseId: number): void {
    this.coursesService.checkEnrollment(courseId).subscribe({
      next: (response) => {
        this.isEnrolled = response.data.isEnrolled;
        this.enrollment = response.data.enrollment;
      },
      error: (error) => {
        console.error('Error checking enrollment:', error);
      }
    });
  }

  enrollCourse(): void {
    if (!this.isAuthenticated) {
      // Redirect to login
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/courses/${this.course.id}` }
      });
      return;
    }

    this.isEnrolling = true;
    this.coursesService.enrollCourse(this.course.id).subscribe({
      next: (response) => {
        this.isEnrolled = true;
        this.enrollment = response.data;
        this.isEnrolling = false;
        
        // Show success message
        alert('Đăng ký khóa học thành công!');
        
        // Navigate to learning page
        this.startLearning();
      },
      error: (error) => {
        console.error('Error enrolling:', error);
        this.isEnrolling = false;
        
        if (error.status === 400 && error.error.message.includes('already enrolled')) {
          this.isEnrolled = true;
          this.startLearning();
        } else {
          alert('Đăng ký thất bại: ' + error.error.message);
        }
      }
    });
  }

  startLearning(): void {
    if (!this.isEnrolled) {
      this.enrollCourse();
      return;
    }
    
    this.router.navigate(['/courses', this.course.id, 'learn']);
  }
}
```

### Cập nhật template `course-detail.component.html`

```html
<!-- Add enrollment button -->
<div class="course-actions">
  <ng-container *ngIf="!isAuthenticated">
    <button class="btn btn-primary btn-lg" (click)="enrollCourse()">
      Đăng nhập để học
    </button>
  </ng-container>

  <ng-container *ngIf="isAuthenticated && !isEnrolled">
    <button 
      class="btn btn-primary btn-lg" 
      (click)="enrollCourse()"
      [disabled]="isEnrolling">
      <span *ngIf="!isEnrolling">Đăng ký khóa học</span>
      <span *ngIf="isEnrolling">Đang đăng ký...</span>
    </button>
  </ng-container>

  <ng-container *ngIf="isAuthenticated && isEnrolled">
    <button class="btn btn-success btn-lg" (click)="startLearning()">
      <i class="fas fa-play"></i> Tiếp tục học
    </button>
    <div class="enrollment-info mt-2">
      <small class="text-muted">
        Tiến độ: {{ enrollment?.progress || 0 }}%
      </small>
    </div>
  </ng-container>
</div>
```

## 3. Cập Nhật Lesson Learning Component

### Thêm progress tracking vào `lesson-learning.component.ts`

```typescript
// cli/src/app/features/courses/lesson-learning/lesson-learning.component.ts

export class LessonLearningComponent implements OnInit, OnDestroy {
  courseId: number = 0;
  lessonId: number = 0;
  lesson: any = null;
  progress: any = null;
  completedLessons: number[] = [];
  
  private startTime: number = 0;
  private lessonTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = +params['courseId'];
      this.lessonId = +params['lessonId'];
      
      this.loadLesson();
      this.loadProgress();
      this.startTimer();
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadLesson(): void {
    this.coursesService.getLessonById(this.lessonId).subscribe({
      next: (response) => {
        this.lesson = response.data;
      },
      error: (error) => {
        console.error('Error loading lesson:', error);
        
        if (error.status === 403) {
          alert('Bạn cần đăng ký khóa học để xem bài học này');
          this.router.navigate(['/courses', this.courseId]);
        }
      }
    });
  }

  loadProgress(): void {
    this.coursesService.getCourseProgress(this.courseId).subscribe({
      next: (response) => {
        this.progress = response.data.progress;
        this.completedLessons = response.data.completedLessonIds;
      },
      error: (error) => {
        console.error('Error loading progress:', error);
      }
    });
  }

  startTimer(): void {
    this.startTime = Date.now();
  }

  stopTimer(): void {
    if (this.lessonTimer) {
      clearInterval(this.lessonTimer);
    }
  }

  getTimeSpent(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  isLessonCompleted(): boolean {
    return this.completedLessons.includes(this.lessonId);
  }

  markAsComplete(): void {
    const timeSpent = this.getTimeSpent();
    
    this.coursesService.completeLesson(this.courseId, this.lessonId, timeSpent).subscribe({
      next: (response) => {
        console.log('Lesson completed:', response);
        
        // Update local state
        if (!this.completedLessons.includes(this.lessonId)) {
          this.completedLessons.push(this.lessonId);
        }
        
        // Update progress
        this.progress = response.data.progress;
        
        // Show success message
        alert(`Hoàn thành bài học! Tiến độ: ${response.data.enrollment.progress}%`);
        
        // Navigate to next lesson if available
        if (this.progress.nextLesson) {
          this.router.navigate(['/courses', this.courseId, 'lessons', this.progress.nextLesson.id]);
        }
      },
      error: (error) => {
        console.error('Error completing lesson:', error);
        alert('Không thể đánh dấu hoàn thành: ' + error.error.message);
      }
    });
  }

  goToNextLesson(): void {
    if (this.progress?.nextLesson) {
      this.router.navigate(['/courses', this.courseId, 'lessons', this.progress.nextLesson.id]);
    }
  }
}
```

### Cập nhật template `lesson-learning.component.html`

```html
<div class="lesson-container">
  <!-- Progress bar -->
  <div class="progress-bar-container">
    <div class="progress">
      <div 
        class="progress-bar" 
        [style.width.%]="progress?.progressPercentage || 0">
        {{ progress?.progressPercentage || 0 }}%
      </div>
    </div>
    <small class="text-muted">
      {{ progress?.completedLessons || 0 }} / {{ progress?.totalLessons || 0 }} bài học
    </small>
  </div>

  <!-- Lesson content -->
  <div class="lesson-content" *ngIf="lesson">
    <h2>{{ lesson.title }}</h2>
    <div [innerHTML]="lesson.content"></div>
  </div>

  <!-- Lesson actions -->
  <div class="lesson-actions">
    <button 
      class="btn btn-success"
      (click)="markAsComplete()"
      [disabled]="isLessonCompleted()">
      <i class="fas fa-check"></i>
      {{ isLessonCompleted() ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành' }}
    </button>

    <button 
      class="btn btn-primary"
      (click)="goToNextLesson()"
      *ngIf="progress?.nextLesson">
      Bài tiếp theo <i class="fas fa-arrow-right"></i>
    </button>
  </div>
</div>
```

## 4. Tạo Learning Dashboard Component (Mới)

### Tạo component mới

```bash
cd cli
ng generate component features/courses/learning-dashboard
```

### Implement `learning-dashboard.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CoursesService } from '../../../core/services/courses.service';

@Component({
  selector: 'app-learning-dashboard',
  templateUrl: './learning-dashboard.component.html',
  styleUrls: ['./learning-dashboard.component.css']
})
export class LearningDashboardComponent implements OnInit {
  dashboard: any = null;
  isLoading: boolean = true;

  constructor(
    private coursesService: CoursesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.coursesService.getLearningDashboard().subscribe({
      next: (response) => {
        this.dashboard = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  continueLearning(courseId: number): void {
    this.router.navigate(['/courses', courseId, 'learn']);
  }

  viewCourse(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }
}
```

### Template `learning-dashboard.component.html`

```html
<div class="learning-dashboard" *ngIf="!isLoading && dashboard">
  <!-- Summary Cards -->
  <div class="row mb-4">
    <div class="col-md-3">
      <div class="card text-center">
        <div class="card-body">
          <h3>{{ dashboard.summary.totalCourses }}</h3>
          <p>Tổng khóa học</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center">
        <div class="card-body">
          <h3>{{ dashboard.summary.completedCourses }}</h3>
          <p>Đã hoàn thành</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center">
        <div class="card-body">
          <h3>{{ dashboard.summary.inProgressCourses }}</h3>
          <p>Đang học</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center">
        <div class="card-body">
          <h3>{{ dashboard.summary.averageProgress }}%</h3>
          <p>Tiến độ trung bình</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Continue Learning -->
  <div class="section" *ngIf="dashboard.nextSteps.length > 0">
    <h3>Tiếp tục học</h3>
    <div class="row">
      <div class="col-md-4" *ngFor="let step of dashboard.nextSteps">
        <div class="card">
          <img [src]="step.thumbnail" class="card-img-top" alt="{{ step.courseTitle }}">
          <div class="card-body">
            <h5>{{ step.courseTitle }}</h5>
            <div class="progress mb-2">
              <div class="progress-bar" [style.width.%]="step.progress">
                {{ step.progress }}%
              </div>
            </div>
            <button class="btn btn-primary btn-sm" (click)="continueLearning(step.courseId)">
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- All Enrollments -->
  <div class="section mt-4">
    <h3>Tất cả khóa học của tôi</h3>
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Khóa học</th>
            <th>Tiến độ</th>
            <th>Trạng thái</th>
            <th>Ngày bắt đầu</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let enrollment of dashboard.enrollments">
            <td>{{ enrollment.course.title }}</td>
            <td>
              <div class="progress">
                <div class="progress-bar" [style.width.%]="enrollment.progress">
                  {{ enrollment.progress }}%
                </div>
              </div>
            </td>
            <td>
              <span class="badge" [ngClass]="{
                'badge-success': enrollment.status === 'completed',
                'badge-primary': enrollment.status === 'in-progress',
                'badge-secondary': enrollment.status === 'not-started'
              }">
                {{ enrollment.status }}
              </span>
            </td>
            <td>{{ enrollment.startDate | date:'dd/MM/yyyy' }}</td>
            <td>
              <button class="btn btn-sm btn-primary" (click)="continueLearning(enrollment.course.id)">
                Học
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<div *ngIf="isLoading" class="text-center">
  <div class="spinner-border" role="status">
    <span class="sr-only">Loading...</span>
  </div>
</div>
```

## 5. Cập Nhật Routes

### Thêm routes mới vào `app-routing.module.ts`

```typescript
const routes: Routes = [
  // ... existing routes
  {
    path: 'my-learning',
    component: LearningDashboardComponent,
    canActivate: [AuthGuard] // Protect with auth guard
  },
  {
    path: 'courses/:courseId/learn',
    component: LessonLearningComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'courses/:courseId/lessons/:lessonId',
    component: LessonLearningComponent,
    canActivate: [AuthGuard]
  }
];
```

## 6. Cập Nhật Navigation

### Thêm link đến dashboard trong header

```html
<!-- header.component.html -->
<nav>
  <a routerLink="/my-learning" *ngIf="isLoggedIn">
    <i class="fas fa-graduation-cap"></i> Khóa học của tôi
  </a>
</nav>
```

## Tổng Kết

Sau khi hoàn thành các bước trên, hệ thống sẽ có:

✅ Kiểm tra enrollment trước khi cho phép học
✅ Nút đăng ký khóa học trên trang chi tiết
✅ Theo dõi tiến độ học tập realtime
✅ Dashboard hiển thị tất cả khóa học đã đăng ký
✅ Tự động đánh dấu bài học hoàn thành
✅ Điều hướng đến bài học tiếp theo
✅ Bảo vệ routes yêu cầu authentication
