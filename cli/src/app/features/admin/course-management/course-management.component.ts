import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  AdminCourse,
  CourseFilters,
  CourseStats,
  AdminCourseService,
} from '../../../core/services/admin-course.service';
import { CourseListComponent } from './components/course-list/course-list.component';
import { CourseFiltersComponent } from './components/course-filters/course-filters.component';
import { CourseStatsComponent } from './components/course-stats/course-stats.component';
import { BulkActionsComponent } from './components/bulk-actions/bulk-actions.component';
import { CourseFormComponent } from './components/course-form/course-form.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { BaseAdminComponent } from '../base-admin.component';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CourseListComponent,
    CourseFiltersComponent,
    CourseStatsComponent,
    BulkActionsComponent,
    CourseFormComponent,
  ],
  templateUrl: './course-management.component.html',
  styleUrl: './course-management.component.css',
})
export class CourseManagementComponent extends BaseAdminComponent implements OnInit {
  courses: AdminCourse[] = [];
  stats: CourseStats | null = null;
  selectedCourses: number[] = [];
  loading = false;
  error: string | null = null;

  // UI State
  activeTab: 'all' | 'deleted' | 'create' = 'all';
  showBulkActions = false;
  isFormModalOpen = false;
  editingCourse: AdminCourse | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  filters: CourseFilters = {
    page: 1,
    limit: 10,
    sortBy: 'created_at_desc',
  };

  searchTerm = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private adminCourseService: AdminCourseService,
    private notificationService: NotificationService,
    authService: AuthService,
    router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
  }

  ngOnInit(): void {
    // ✅ Only run in browser, not during SSR
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        this.loadInitialData();
      }
    });
  }

  private loadInitialData(): void {
    this.loadCourses();
    this.loadStats();
  }

  loadCourses(): void {
    // ✅ Skip during SSR
    if (!this.isBrowser) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Ensure is_deleted filter is set based on active tab
    const filtersWithDeletedFlag = {
      ...this.filters,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };

    // Use the same endpoint but with different is_deleted filter
    // Backend should filter based on is_deleted parameter
    const service = this.activeTab === 'deleted'
      ? this.adminCourseService.getDeletedCourses(filtersWithDeletedFlag)
      : this.adminCourseService.getCourses(filtersWithDeletedFlag);

    service.subscribe({
      next: (response) => {
        if (response.success) {
          this.courses = response.data;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.total_pages;
          this.totalItems = response.pagination.total_items;
          this.itemsPerPage = response.pagination.items_per_page;
        } else {
          this.error = 'Failed to load courses';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load courses';
        this.loading = false;
      },
    });
  }

  loadStats(): void {
    // ✅ Skip during SSR
    if (!this.isBrowser) {
      return;
    }

    console.log('📊 Loading course statistics...');
    this.adminCourseService.getCourseStatistics().subscribe({
      next: (response) => {
        console.log('✅ Statistics loaded:', response);
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('❌ Failed to load statistics:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        
        // Show user-friendly error
        if (error.status === 401) {
          this.notificationService.error('Session expired', 'Please login again.');
          this.router.navigate(['/auth/login']);
        } else {
          this.notificationService.error('Error', 'Failed to load statistics');
        }
      },
    });
  }

  onTabChange(tab: 'all' | 'deleted' | 'create'): void {
    if (tab === 'create') {
      this.openCreateModal();
      return;
    }

    this.activeTab = tab;
    this.selectedCourses = [];
    this.showBulkActions = false;
    this.currentPage = 1;
    
    // Reset filters and set is_deleted based on tab
    this.filters = {
      page: 1,
      limit: this.itemsPerPage,
      sortBy: this.filters.sortBy || 'created_at_desc',
      is_deleted: tab === 'deleted' ? true : false,
    };
    
    this.loadCourses();
  }

  onFiltersChange(newFilters: CourseFilters): void {
    // Preserve is_deleted filter based on active tab
    this.filters = { 
      ...this.filters, 
      ...newFilters, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.loadCourses();
  }

  onSearch(): void {
    // Preserve is_deleted filter based on active tab
    this.filters = { 
      ...this.filters, 
      search: this.searchTerm, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
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

    this.filters = {
      ...this.filters,
      sortBy: `${sortBy}_${this.sortOrder}`,
      page: 1,
    };
    this.currentPage = 1;
    this.loadCourses();
  }

  onSortChange(event: { sortBy: string; order: 'asc' | 'desc' }): void {
    this.sortBy = event.sortBy;
    this.sortOrder = event.order;

    // Preserve is_deleted filter based on active tab
    this.filters = {
      ...this.filters,
      sortBy: `${event.sortBy}_${event.order}`,
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.loadCourses();
  }

  onViewCourse(course: AdminCourse): void {
    // Navigate to course detail page or open modal
    this.router.navigate(['/courses', course.id]);
  }

  onRestoreCourse(courseId: number): void {
    console.log('🔄 [CourseManagement] Attempting to restore course:', courseId);
    
    if (!confirm('Are you sure you want to restore this course?')) {
      console.log('❌ [CourseManagement] Restore cancelled by user');
      return;
    }

    console.log('📤 [CourseManagement] Sending restore request to API...');
    this.adminCourseService.restoreCourse(courseId).subscribe({
      next: (response) => {
        console.log('✅ [CourseManagement] Restore response:', response);
        if (response.success && response.data) {
          console.log('✅ [CourseManagement] Course restored. is_deleted:', response.data.is_deleted);
          
          this.notificationService.success('Success', 'Course restored successfully');
          
          // If we're on the deleted tab, switch to 'all' tab to show the restored course
          if (this.activeTab === 'deleted') {
            console.log('🔄 [CourseManagement] Switching to "all" tab');
            this.activeTab = 'all';
            this.filters = {
              ...this.filters,
              is_deleted: false,
              page: 1
            };
            this.currentPage = 1;
          }
          
          // Reload courses and stats
          console.log('🔄 [CourseManagement] Reloading courses and stats...');
          this.loadCourses();
          this.loadStats();
        } else {
          console.error('❌ [CourseManagement] Restore failed - response not successful:', response);
          const errorMsg = response?.message || 'Failed to restore course';
          this.notificationService.error('Error', errorMsg);
        }
      },
      error: (error) => {
        console.error('❌ [CourseManagement] Restore error:', error);
        console.error('❌ [CourseManagement] Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          error: error?.error,
          message: error?.message
        });
        
        let errorMessage = 'Failed to restore course';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.error) {
          errorMessage = error.error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      },
    });
  }

  onDeleteCourse(courseId: number): void {
    const message = this.activeTab === 'deleted' 
      ? 'Are you sure you want to permanently delete this course? This action cannot be undone.'
      : 'Are you sure you want to delete this course?';
    
    if (!confirm(message)) {
      return;
    }

    const deleteService = this.activeTab === 'deleted'
      ? this.adminCourseService.permanentlyDeleteCourse(courseId)
      : this.adminCourseService.deleteCourse(courseId);

    deleteService.subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Success', 'Course deleted successfully');
          this.loadCourses();
          this.loadStats();
        }
      },
      error: (error) => {
        this.notificationService.error('Error', error.message || 'Failed to delete course');
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Preserve is_deleted filter based on active tab
    this.filters = { 
      ...this.filters, 
      page,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.loadCourses();
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.filters = { ...this.filters, limit: itemsPerPage, page: 1 };
    this.currentPage = 1;
    this.loadCourses();
  }

  onCourseToggle(event: { courseId: number; selected: boolean }): void {
    if (event.selected) {
      this.selectedCourses = [...this.selectedCourses, event.courseId];
    } else {
      this.selectedCourses = this.selectedCourses.filter(
        (id) => id !== event.courseId
      );
    }
    this.showBulkActions = this.selectedCourses.length > 0;
  }

  onSelectAll(selectAll: boolean): void {
    if (selectAll) {
      this.selectedCourses = this.courses.map((c) => c.id);
    } else {
      this.selectedCourses = [];
    }
    this.showBulkActions = this.selectedCourses.length > 0;
  }

  onCourseSelect(courseIds: number[]): void {
    this.selectedCourses = courseIds;
    this.showBulkActions = courseIds.length > 0;
  }

  onBulkAction(action: string): void {
    if (this.selectedCourses.length === 0) return;

    switch (action) {
      case 'delete':
        this.bulkDeleteCourses();
        break;
      case 'restore':
        this.bulkRestoreCourses();
        break;
      case 'publish':
        this.bulkUpdateStatus('published');
        break;
      case 'draft':
        this.bulkUpdateStatus('draft');
        break;
      case 'archive':
        this.bulkUpdateStatus('archived');
        break;
    }
  }

  bulkDeleteCourses(): void {
    const isPermanent = this.activeTab === 'deleted';
    const message = isPermanent
      ? `Are you sure you want to PERMANENTLY delete ${this.selectedCourses.length} courses? This action cannot be undone.`
      : `Are you sure you want to delete ${this.selectedCourses.length} courses?`;

    if (!confirm(message)) {
      return;
    }

    this.adminCourseService.bulkDeleteCourses(this.selectedCourses, isPermanent).subscribe({
      next: (response) => {
        if (response.success) {
          const action = isPermanent ? 'permanently deleted' : 'deleted';
          this.notificationService.success(
            'Success',
            `Successfully ${action} ${this.selectedCourses.length} courses`
          );
          this.selectedCourses = [];
          this.showBulkActions = false;
          this.loadCourses();
          this.loadStats();
        }
      },
      error: (error) => {
        this.notificationService.error(
          'Error',
          error.message || 'Failed to delete courses'
        );
      },
    });
  }

  bulkRestoreCourses(): void {
    if (!confirm(`Are you sure you want to restore ${this.selectedCourses.length} courses?`)) {
      return;
    }

    console.log('🔄 [CourseManagement] Bulk restore courses:', this.selectedCourses);
    this.adminCourseService.bulkRestoreCourses(this.selectedCourses).subscribe({
      next: (response) => {
        console.log('✅ [CourseManagement] Bulk restore response:', response);
        if (response.success) {
          const restoredCount = response.data?.restoredCount || this.selectedCourses.length;
          const totalRequested = response.data?.totalRequested || this.selectedCourses.length;
          
          if (restoredCount === totalRequested) {
            this.notificationService.success(
              'Success',
              `Successfully restored ${restoredCount} courses`
            );
          } else {
            this.notificationService.warning(
              'Partial Success',
              `Restored ${restoredCount} of ${totalRequested} courses. Some courses may not have been found or already restored.`
            );
          }
          
          // If we're on the deleted tab, switch to 'all' tab to show the restored courses
          if (this.activeTab === 'deleted') {
            this.activeTab = 'all';
            this.filters = {
              ...this.filters,
              is_deleted: false,
              page: 1
            };
            this.currentPage = 1;
          }
          
          this.selectedCourses = [];
          this.showBulkActions = false;
          this.loadCourses();
          this.loadStats();
        } else {
          console.error('❌ [CourseManagement] Bulk restore failed:', response);
          this.notificationService.error(
            'Error',
            response.message || 'Failed to restore courses'
          );
        }
      },
      error: (error) => {
        console.error('❌ [CourseManagement] Bulk restore error:', error);
        console.error('❌ [CourseManagement] Full error object:', JSON.stringify(error, null, 2));
        console.error('❌ [CourseManagement] Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          error: error?.error,
          message: error?.message
        });
        console.error('❌ [CourseManagement] error.error:', error?.error);
        console.error('❌ [CourseManagement] error.error.errors:', error?.error?.errors);
        
        let errorMessage = 'Failed to restore courses';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
          // Handle validation errors
          const validationErrors = error.error.errors.map((e: any) => {
            const msg = e.msg || e.message || JSON.stringify(e);
            const field = e.param || e.path || '';
            return field ? `${field}: ${msg}` : msg;
          }).join(', ');
          errorMessage = `Validation errors: ${validationErrors}`;
        } else if (error?.error?.error) {
          errorMessage = error.error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      },
    });
  }

  bulkUpdateStatus(status: string): void {
    if (!confirm(`Are you sure you want to set ${this.selectedCourses.length} courses to ${status}?`)) {
      return;
    }

    this.adminCourseService
      .bulkUpdateCourses(this.selectedCourses, { status })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success(
              'Success',
              `Successfully updated ${this.selectedCourses.length} courses to ${status}`
            );
            this.selectedCourses = [];
            this.showBulkActions = false;
            this.loadCourses();
            this.loadStats();
          }
        },
        error: (error) => {
          this.notificationService.error(
            'Error',
            error.message || 'Failed to update courses'
          );
        },
      });
  }

  openCreateModal(): void {
    this.editingCourse = null;
    this.isFormModalOpen = true;
  }

  openEditModal(course: AdminCourse): void {
    this.editingCourse = course;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.editingCourse = null;
  }

  onCourseCreated(course: AdminCourse): void {
    console.log('Course created successfully!');
    this.closeFormModal();
    this.loadCourses();
    this.loadStats();
  }

  onCourseUpdated(course: AdminCourse): void {
    console.log('Course updated successfully!');
    this.closeFormModal();
    this.loadCourses();
    this.loadStats();
  }

  onExport(format: 'json' | 'csv'): void {
    this.adminCourseService
      .exportCourses(format, this.activeTab === 'deleted')
      .subscribe({
        next: (blob: Blob) => {
          const filename = `courses_${
            new Date().toISOString().split('T')[0]
          }.${format}`;
          this.adminCourseService.downloadExport(blob, filename);
          console.log('Courses exported successfully!');
        },
        error: (error: any) => {
          console.error('Failed to export courses');
        },
      });
  }
}
