import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseAdminComponent } from '../base-admin.component';
import { AuthService } from '../../../core/services/auth.service';
import { AdminLessonService, AdminLesson, LessonFilters, LessonStats } from '../../../core/services/admin-lesson.service';
import { AdminCourseService } from '../../../core/services/admin-course.service';
import { CoursesService } from '../../../core/services/courses.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CourseModule } from '../../../core/models/course-module.model';
import { AdminCourse } from '../../../core/services/admin-course.service';
import { LessonFormComponent } from './components/lesson-form/lesson-form.component';

@Component({
  selector: 'app-lesson-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LessonFormComponent],
  templateUrl: './lesson-management.component.html',
  styleUrl: './lesson-management.component.css'
})
export class LessonManagementComponent extends BaseAdminComponent implements OnInit {
  lessons: AdminLesson[] = [];
  stats: LessonStats | null = null;
  selectedLessons: number[] = [];
  loading = false;
  loadingStats = false;
  error: string | null = null;

  // UI State
  isFormModalOpen = false;
  editingLesson: AdminLesson | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  filters: LessonFilters = {
    page: 1,
    limit: 10,
    sortBy: 'created_at_desc',
  };

  searchTerm = '';
  sortBy = 'created_at_desc';

  // Course and Module filters
  courses: AdminCourse[] = [];
  modules: CourseModule[] = [];
  selectedCourseId: number | null = null;
  selectedModuleId: number | null = null;
  selectedType: 'document' | 'video' | 'exercise' | 'quiz' | null = null;

  // Expose Math to template
  Math = Math;

  constructor(
    private adminLessonService: AdminLessonService,
    private adminCourseService: AdminCourseService,
    private coursesService: CoursesService,
    private notificationService: NotificationService,
    authService: AuthService,
    router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
  }

  ngOnInit(): void {
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        // Check for courseId in query params
        this.route.queryParams.subscribe(params => {
          const courseId = params['courseId'];
          if (courseId) {
            this.selectedCourseId = Number(courseId);
            // Load modules for the selected course
            if (this.selectedCourseId) {
              this.loadModules(this.selectedCourseId);
            }
          }
          this.loadInitialData();
        });
      }
    });
  }

  private loadInitialData(): void {
    this.loadLessons();
    this.loadStats();
    this.loadCourses();
  }

  loadLessons(): void {
    if (!this.isBrowser) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Build filters
    const filters: LessonFilters = {
      ...this.filters,
      search: this.searchTerm || undefined,
      course_id: this.selectedCourseId || undefined,
      module_id: this.selectedModuleId || undefined,
      type: this.selectedType || undefined,
      sortBy: this.sortBy,
    };

    this.adminLessonService.getLessons(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.lessons = response.data;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.total_pages;
          this.totalItems = response.pagination.total_items;
          this.itemsPerPage = response.pagination.items_per_page;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
        this.error = error.error?.message || 'Failed to load lessons';
        this.loading = false;
      },
    });
  }

  loadStats(): void {
    if (!this.isBrowser) {
      return;
    }

    this.loadingStats = true;
    this.adminLessonService.getLessonStatistics(
      this.selectedCourseId || undefined,
      this.selectedModuleId || undefined
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.loadingStats = false;
      },
    });
  }

  loadCourses(): void {
    if (!this.isBrowser) {
      return;
    }

    this.adminCourseService.getCourses({ limit: 1000, page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.courses = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      },
    });
  }

  loadModules(courseId: number): void {
    if (!this.isBrowser) {
      return;
    }

    this.coursesService.getCourseModules(courseId).subscribe({
      next: (modules) => {
        this.modules = modules;
      },
      error: (error) => {
        console.error('Error loading modules:', error);
        this.modules = [];
      },
    });
  }

  onSearch(): void {
    this.filters = {
      ...this.filters,
      search: this.searchTerm,
      page: 1,
    };
    this.currentPage = 1;
    this.loadLessons();
  }

  onCourseFilterChange(): void {
    this.selectedModuleId = null;
    this.modules = [];
    
    if (this.selectedCourseId) {
      this.loadModules(this.selectedCourseId);
    }

    this.filters = {
      ...this.filters,
      course_id: this.selectedCourseId || undefined,
      module_id: undefined,
      page: 1,
    };
    this.currentPage = 1;
    this.loadLessons();
    this.loadStats();
  }

  onModuleFilterChange(): void {
    this.filters = {
      ...this.filters,
      module_id: this.selectedModuleId || undefined,
      page: 1,
    };
    this.currentPage = 1;
    this.loadLessons();
    this.loadStats();
  }

  onTypeFilterChange(): void {
    this.filters = {
      ...this.filters,
      type: this.selectedType || undefined,
      page: 1,
    };
    this.currentPage = 1;
    this.loadLessons();
  }

  onSortChange(): void {
    this.filters = {
      ...this.filters,
      sortBy: this.sortBy,
      page: 1,
    };
    this.currentPage = 1;
    this.loadLessons();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.filters = {
      ...this.filters,
      page,
    };
    this.loadLessons();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Selection methods
  isLessonSelected(lessonId: number): boolean {
    return this.selectedLessons.includes(lessonId);
  }

  onLessonToggle(lessonId: number): void {
    if (this.isLessonSelected(lessonId)) {
      this.selectedLessons = this.selectedLessons.filter(id => id !== lessonId);
    } else {
      this.selectedLessons = [...this.selectedLessons, lessonId];
    }
  }

  isAllSelected(): boolean {
    return this.lessons.length > 0 && this.selectedLessons.length === this.lessons.length;
  }

  onSelectAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedLessons = this.lessons.map(l => l.id);
    } else {
      this.selectedLessons = [];
    }
  }

  onBulkDelete(): void {
    if (this.selectedLessons.length === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to delete ${this.selectedLessons.length} lesson(s)? This action cannot be undone.`)) {
      return;
    }

    this.adminLessonService.bulkDeleteLessons(this.selectedLessons).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            'Success',
            `Successfully deleted ${response.data?.deletedCount || this.selectedLessons.length} lesson(s)`
          );
          this.selectedLessons = [];
          this.loadLessons();
          this.loadStats();
        }
      },
      error: (error) => {
        this.notificationService.error(
          'Error',
          error.error?.message || 'Failed to delete lessons'
        );
      },
    });
  }

  onDeleteLesson(lessonId: number): void {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }

    this.adminLessonService.deleteLesson(lessonId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Success', 'Lesson deleted successfully');
          this.loadLessons();
          this.loadStats();
        }
      },
      error: (error) => {
        this.notificationService.error(
          'Error',
          error.error?.message || 'Failed to delete lesson'
        );
      },
    });
  }

  // Modal methods
  openCreateModal(): void {
    this.editingLesson = null;
    this.isFormModalOpen = true;
  }

  openEditModal(lesson: AdminLesson): void {
    this.editingLesson = lesson;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.editingLesson = null;
  }

  onLessonCreated(lesson: AdminLesson): void {
    this.notificationService.success('Success', 'Lesson created successfully');
    this.closeFormModal();
    this.loadLessons();
    this.loadStats();
  }

  onLessonUpdated(lesson: AdminLesson): void {
    this.notificationService.success('Success', 'Lesson updated successfully');
    this.closeFormModal();
    this.loadLessons();
    this.loadStats();
  }
}
