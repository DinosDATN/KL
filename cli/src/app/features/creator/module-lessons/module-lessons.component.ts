import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';

interface Lesson {
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

interface Module {
  id: number;
  course_id: number;
  title: string;
  position: number;
}

@Component({
  selector: 'app-module-lessons',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './module-lessons.component.html',
  styleUrls: ['./module-lessons.component.css'],
})
export class ModuleLessonsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  courseId: number = 0;
  moduleId: number = 0;
  module: Module | null = null;
  lessons: Lesson[] = [];
  filteredLessons: Lesson[] = [];
  loading = false;
  
  // Filters and search
  searchTerm = '';
  selectedType: string = 'all';
  sortBy: 'position' | 'title' | 'duration' = 'position';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Modal state
  showLessonModal = false;
  editingLesson: Lesson | null = null;
  
  // Form data
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
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.courseId = +params['courseId'];
      this.moduleId = +params['moduleId'];
      this.loadModule();
      this.loadLessons();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadModule(): void {
    this.http.get<any>(`${environment.apiUrl}/course-content/modules/${this.moduleId}`, {
      withCredentials: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.module = response.data;
        }
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể tải thông tin module');
      }
    });
  }

  loadLessons(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/course-content/modules/${this.moduleId}/lessons`, {
      withCredentials: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.lessons = response.data || [];
          this.applyFilters();
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Lỗi', 'Không thể tải danh sách bài học');
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.lessons];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(term) ||
        (lesson.content && lesson.content.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(lesson => lesson.type === this.selectedType);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'position':
          comparison = a.position - b.position;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredLessons = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.cdr.detectChanges();
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'all';
    this.sortBy = 'position';
    this.sortOrder = 'asc';
    this.currentPage = 1;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || this.selectedType !== 'all';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  getPaginatedLessons(): Lesson[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredLessons.slice(start, end);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  openCreateLessonModal(): void {
    this.editingLesson = null;
    this.lessonForm = {
      title: '',
      type: 'document',
      content: '',
      duration: 0,
      position: this.lessons.length + 1
    };
    this.showLessonModal = true;
  }

  openEditLessonModal(lesson: Lesson): void {
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
  }

  saveLesson(): void {
    if (!this.lessonForm.title.trim()) {
      this.notificationService.error('Lỗi', 'Vui lòng nhập tên bài học');
      return;
    }

    const url = this.editingLesson
      ? `${environment.apiUrl}/course-content/lessons/${this.editingLesson.id}`
      : `${environment.apiUrl}/course-content/modules/${this.moduleId}/lessons`;
    
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
        this.loadLessons();
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể lưu bài học');
      }
    });
  }

  deleteLesson(lesson: Lesson): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title}"?`)) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/course-content/lessons/${lesson.id}`, {
      withCredentials: true
    }).subscribe({
      next: () => {
        this.notificationService.success('Thành công', 'Xóa bài học thành công');
        this.loadLessons();
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

  getLessonTypeColor(type: string): string {
    const colors: Record<string, string> = {
      document: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      video: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      exercise: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      quiz: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }

  getTotalDuration(): number {
    return this.filteredLessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  }

  getLessonTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'all', label: 'Tất cả' },
      { value: 'document', label: 'Tài liệu' },
      { value: 'video', label: 'Video' },
      { value: 'exercise', label: 'Bài tập' },
      { value: 'quiz', label: 'Trắc nghiệm' }
    ];
  }

  goBack(): void {
    this.router.navigate(['/creator/courses', this.courseId, 'content']);
  }

  // Expose Math to template
  Math = Math;
}
