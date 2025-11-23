import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  CreatorCourseService,
  CreatorCourse,
  CreatorCourseStats,
} from '../../../core/services/creator-course.service';
import { CourseFilters } from '../../../core/services/admin-course.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { CreatorCourseFormComponent } from './components/creator-course-form/creator-course-form.component';

@Component({
  selector: 'app-creator-course-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CreatorCourseFormComponent,
  ],
  templateUrl: './creator-course-management.component.html',
  styleUrls: ['./creator-course-management.component.css'],
})
export class CreatorCourseManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  courses: CreatorCourse[] = [];
  stats: CreatorCourseStats | null = null;
  loading = false;
  error: string | null = null;

  // UI State
  activeTab: 'all' | 'draft' | 'published' | 'archived' = 'all';
  showCreateModal = false;
  editingCourse: CreatorCourse | null = null;
  selectedStatus: string = 'all';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  searchTerm = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private creatorCourseService: CreatorCourseService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check if user is creator
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (
      !currentUser ||
      (currentUser.role !== 'creator' && currentUser.role !== 'admin')
    ) {
      this.error = 'Bạn cần quyền creator để truy cập trang này';
      return;
    }

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loadCourses();
    this.loadStatistics();
  }

  loadCourses(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loading = true;
    this.error = null;

    const filters: CourseFilters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: `${this.sortBy}_${this.sortOrder}`,
      search: this.searchTerm || undefined,
    };

    // Add status filter based on active tab
    if (this.activeTab !== 'all') {
      filters.status = this.activeTab;
    }

    this.creatorCourseService
      .getMyCourses(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          this.courses = response.data;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.total_pages;
          this.totalItems = response.pagination.total_items;
        },
        error: (error) => {
          this.error = error.message || 'Không thể tải danh sách khóa học';
          this.notificationService.error(
            'Lỗi',
            'Không thể tải danh sách khóa học'
          );
        },
      });
  }

  loadStatistics(): void {
    this.creatorCourseService
      .getCreatorCourseStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        },
      });
  }

  onTabChange(tab: 'all' | 'draft' | 'published' | 'archived'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadCourses();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCourses();
  }

  onSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.loadCourses();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCourses();
  }

  openCreateModal(event?: Event): void {
    try {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      console.log('Opening create course modal...');
      console.log('Current route:', this.router.url);
      console.log('Current showCreateModal before:', this.showCreateModal);

      this.editingCourse = null;
      this.showCreateModal = true;

      console.log('Modal state after set:', this.showCreateModal);

      // Force change detection
      this.cdr.detectChanges();

      setTimeout(() => {
        console.log('After timeout - showCreateModal:', this.showCreateModal);
        this.cdr.detectChanges();
      }, 0);
    } catch (error) {
      console.error('Error opening create modal:', error);
      console.error(
        'Error stack:',
        error instanceof Error ? error.stack : 'No stack'
      );
      this.notificationService.error('Lỗi', 'Không thể mở form tạo khóa học');
    }
  }

  openEditModal(course: CreatorCourse): void {
    // Load full course details before editing
    this.loading = true;
    this.creatorCourseService
      .getMyCourse(course.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.editingCourse = response.data;
            this.showCreateModal = true;
          } else {
            this.notificationService.error(
              'Lỗi',
              response.message || 'Không thể tải thông tin khóa học'
            );
          }
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.message || 'Không thể tải thông tin khóa học'
          );
        },
      });
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.editingCourse = null;
  }

  onCourseCreated(course: CreatorCourse): void {
    this.closeModal();
    this.loadCourses();
    this.loadStatistics();
    this.notificationService.success('Thành công', 'Tạo khóa học thành công!');
  }

  onCourseUpdated(course: CreatorCourse): void {
    this.closeModal();
    this.loadCourses();
    this.loadStatistics();
    this.notificationService.success(
      'Thành công',
      'Cập nhật khóa học thành công!'
    );
  }

  onDeleteCourse(course: CreatorCourse): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa khóa học "${course.title}"?`)) {
      return;
    }

    this.loading = true;
    this.creatorCourseService
      .deleteCourseDirect(course.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success(
              'Thành công',
              'Xóa khóa học thành công!'
            );
            this.loadCourses();
            this.loadStatistics();
          } else {
            this.notificationService.error(
              'Lỗi',
              response.message || 'Không thể xóa khóa học'
            );
          }
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.message || 'Không thể xóa khóa học'
          );
        },
      });
  }

  onUpdateStatus(
    course: CreatorCourse,
    status: 'draft' | 'published' | 'archived'
  ): void {
    this.loading = true;
    this.creatorCourseService
      .updateCourseStatusDirect(course.id, status)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success(
              'Thành công',
              'Cập nhật trạng thái thành công!'
            );
            this.loadCourses();
            this.loadStatistics();
          } else {
            this.notificationService.error(
              'Lỗi',
              response.message || 'Không thể cập nhật trạng thái'
            );
          }
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.message || 'Không thể cập nhật trạng thái'
          );
        },
      });
  }

  viewCourse(course: CreatorCourse): void {
    this.router.navigate(['/courses', course.id]);
  }

  editCourse(course: CreatorCourse): void {
    this.openEditModal(course);
  }

  manageContent(course: CreatorCourse): void {
    this.router.navigate(['/creator/courses', course.id, 'content']);
  }

  viewAnalytics(course: CreatorCourse): void {
    this.router.navigate(['/creator/courses', course.id, 'analytics']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'published':
        return 'Đã xuất bản';
      case 'draft':
        return 'Bản nháp';
      case 'archived':
        return 'Đã lưu trữ';
      default:
        return status;
    }
  }

  // Expose Math to template
  Math = Math;

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
