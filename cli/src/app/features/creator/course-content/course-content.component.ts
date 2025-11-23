import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CreatorCourseService } from '../../../core/services/creator-course.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AdminLesson {
  id: number;
  module_id: number;
  title: string;
  content?: string | null;
  duration?: number | null;
  position: number;
  type: 'document' | 'video' | 'exercise' | 'quiz';
  created_at?: string;
  updated_at?: string | null;
}

interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  position: number;
  lessons?: AdminLesson[];
  expanded?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-course-content',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-content.component.html',
  styleUrls: ['./course-content.component.css'],
})
export class CourseContentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  courseId: number = 0;
  course: any = null;
  modules: CourseModule[] = [];
  loading = false;
  
  // Modal states
  showModuleModal = false;
  showLessonModal = false;
  editingModule: CourseModule | null = null;
  editingLesson: AdminLesson | null = null;
  selectedModuleId: number | null = null;
  
  // Form data
  moduleForm = {
    title: '',
    position: 1
  };
  
  lessonForm = {
    title: '',
    type: 'document' as 'document' | 'video' | 'exercise' | 'quiz',
    content: '',
    duration: 0,
    position: 1
  };

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
      this.loadModules();
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
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.course = response.data;
          }
        },
        error: () => {
          this.notificationService.error('Lỗi', 'Không thể tải thông tin khóa học');
        },
      });
  }

  loadModules(): void {
    this.http.get<any>(`${environment.apiUrl}/course-content/courses/${this.courseId}/modules`, {
      params: { include_lessons: 'true' },
      withCredentials: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.modules = response.data || [];
          this.modules.forEach(module => {
            module.expanded = false;
            if (module.lessons) {
              // Lessons already included from API
            } else {
              this.loadModuleLessons(module.id);
            }
          });
        }
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể tải danh sách module');
      }
    });
  }

  loadModuleLessons(moduleId: number): void {
    this.http.get<any>(`${environment.apiUrl}/course-content/modules/${moduleId}/lessons`, {
      withCredentials: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const module = this.modules.find(m => m.id === moduleId);
        if (module && response.success) {
          module.lessons = response.data || [];
        }
      },
      error: () => {
        console.error('Không thể tải lessons cho module', moduleId);
      }
    });
  }

  toggleModule(module: CourseModule): void {
    module.expanded = !module.expanded;
  }

  // Module CRUD
  openCreateModuleModal(): void {
    this.editingModule = null;
    this.moduleForm = {
      title: '',
      position: this.modules.length + 1
    };
    this.showModuleModal = true;
  }

  openEditModuleModal(module: CourseModule): void {
    this.editingModule = module;
    this.moduleForm = {
      title: module.title,
      position: module.position
    };
    this.showModuleModal = true;
  }

  closeModuleModal(): void {
    this.showModuleModal = false;
    this.editingModule = null;
  }

  saveModule(): void {
    if (!this.moduleForm.title.trim()) {
      this.notificationService.error('Lỗi', 'Vui lòng nhập tên module');
      return;
    }

    const url = this.editingModule
      ? `${environment.apiUrl}/course-content/modules/${this.editingModule.id}`
      : `${environment.apiUrl}/course-content/courses/${this.courseId}/modules`;
    
    const method = this.editingModule ? 'put' : 'post';
    const data = this.moduleForm;

    this.http.request(method, url, {
      body: data,
      withCredentials: true
    }).subscribe({
      next: () => {
        this.notificationService.success(
          'Thành công',
          this.editingModule ? 'Cập nhật module thành công' : 'Tạo module thành công'
        );
        this.closeModuleModal();
        this.loadModules();
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể lưu module');
      }
    });
  }

  deleteModule(module: CourseModule): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa module "${module.title}"?`)) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/course-content/modules/${module.id}`, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.notificationService.success('Thành công', 'Xóa module thành công');
        this.loadModules();
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể xóa module');
      }
    });
  }

  // Lesson CRUD
  openCreateLessonModal(moduleId: number): void {
    this.selectedModuleId = moduleId;
    this.editingLesson = null;
    const module = this.modules.find(m => m.id === moduleId);
    this.lessonForm = {
      title: '',
      type: 'document',
      content: '',
      duration: 0,
      position: (module?.lessons?.length || 0) + 1
    };
    this.showLessonModal = true;
  }

  openEditLessonModal(lesson: AdminLesson): void {
    this.selectedModuleId = lesson.module_id;
    this.editingLesson = lesson;
    this.lessonForm = {
      title: lesson.title,
      type: lesson.type,
      content: lesson.content || '',
      duration: lesson.duration || 0,
      position: lesson.position
    };
    this.showLessonModal = true;
  }

  closeLessonModal(): void {
    this.showLessonModal = false;
    this.editingLesson = null;
    this.selectedModuleId = null;
  }

  saveLesson(): void {
    if (!this.lessonForm.title.trim()) {
      this.notificationService.error('Lỗi', 'Vui lòng nhập tên bài học');
      return;
    }

    if (!this.selectedModuleId) {
      this.notificationService.error('Lỗi', 'Module không hợp lệ');
      return;
    }

    const url = this.editingLesson
      ? `${environment.apiUrl}/course-content/lessons/${this.editingLesson.id}`
      : `${environment.apiUrl}/course-content/modules/${this.selectedModuleId}/lessons`;
    
    const method = this.editingLesson ? 'put' : 'post';

    this.http.request(method, url, {
      body: this.lessonForm,
      withCredentials: true
    }).subscribe({
      next: () => {
        this.notificationService.success(
          'Thành công',
          this.editingLesson ? 'Cập nhật bài học thành công' : 'Tạo bài học thành công'
        );
        this.closeLessonModal();
        if (this.selectedModuleId) {
          this.loadModuleLessons(this.selectedModuleId);
        }
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể lưu bài học');
      }
    });
  }

  deleteLesson(lesson: AdminLesson): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title}"?`)) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/course-content/lessons/${lesson.id}`, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.notificationService.success('Thành công', 'Xóa bài học thành công');
        this.loadModuleLessons(lesson.module_id);
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể xóa bài học');
      }
    });
  }

  getLessonTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      document: 'Tài liệu',
      video: 'Video',
      exercise: 'Bài tập',
      quiz: 'Trắc nghiệm'
    };
    return labels[type] || type;
  }

  getLessonTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      document: 'icon-file-text',
      video: 'icon-video',
      exercise: 'icon-code',
      quiz: 'icon-help-circle'
    };
    return icons[type] || 'icon-file';
  }

  goBack(): void {
    this.router.navigate(['/creator/courses']);
  }
}
