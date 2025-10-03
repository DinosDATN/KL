import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminCourse, CourseFilters, CourseStats, AdminCourseService } from '../../../core/services/admin-course.service';
import { CourseListComponent } from './components/course-list/course-list.component';
import { CourseFiltersComponent } from './components/course-filters/course-filters.component';
import { CourseStatsComponent } from './components/course-stats/course-stats.component';
import { BulkActionsComponent } from './components/bulk-actions/bulk-actions.component';
import { CourseFormComponent } from './components/course-form/course-form.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

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
    CourseFormComponent
  ],
  templateUrl: './course-management.component.html',
  styleUrl: './course-management.component.css'
})
export class CourseManagementComponent implements OnInit {
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
    limit: 10
  };
  
  searchTerm = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private adminCourseService: AdminCourseService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    // Check if user is admin
    this.checkAdminAccess();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }
  
  private checkAdminAccess(): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
      return;
    }
  }

  private loadInitialData(): void {
    this.loadCourses();
    this.loadStats();
  }
  
  loadCourses(): void {
    this.loading = true;
    this.error = null;
    
    const service = this.activeTab === 'deleted' 
      ? this.adminCourseService.getDeletedCourses(this.filters)
      : this.adminCourseService.getCourses(this.filters);
      
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
      }
    });
  }
  
  loadStats(): void {
    this.adminCourseService.getCourseStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load statistics:', error);
      }
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
    this.filters = { ...this.filters, page: 1 };
    this.loadCourses();
  }
  
  onFiltersChange(newFilters: CourseFilters): void {
    this.filters = { ...this.filters, ...newFilters, page: 1 };
    this.currentPage = 1;
    this.loadCourses();
  }
  
  onSearch(): void {
    this.filters = { ...this.filters, search: this.searchTerm, page: 1 };
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
      page: 1
    };
    this.currentPage = 1;
    this.loadCourses();
  }
  
  onSortChange(event: {sortBy: string, order: 'asc' | 'desc'}): void {
    this.sortBy = event.sortBy;
    this.sortOrder = event.order;
    
    this.filters = {
      ...this.filters,
      sortBy: `${event.sortBy}_${event.order}`,
      page: 1
    };
    this.currentPage = 1;
    this.loadCourses();
  }
  
  onDeleteCourse(courseId: number): void {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }
    
    this.adminCourseService.deleteCourse(courseId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadCourses();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error('Failed to delete course:', error);
      }
    });
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.filters = { ...this.filters, page };
    this.loadCourses();
  }
  
  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.filters = { ...this.filters, limit: itemsPerPage, page: 1 };
    this.currentPage = 1;
    this.loadCourses();
  }
  
  onCourseToggle(event: {courseId: number, selected: boolean}): void {
    if (event.selected) {
      this.selectedCourses = [...this.selectedCourses, event.courseId];
    } else {
      this.selectedCourses = this.selectedCourses.filter(id => id !== event.courseId);
    }
    this.showBulkActions = this.selectedCourses.length > 0;
  }
  
  onSelectAll(selectAll: boolean): void {
    if (selectAll) {
      this.selectedCourses = this.courses.map(c => c.id);
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
    if (!confirm(`Are you sure you want to delete ${this.selectedCourses.length} courses?`)) {
      return;
    }
    
    this.adminCourseService.bulkDeleteCourses(this.selectedCourses).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`Successfully deleted ${this.selectedCourses.length} courses`);
          this.selectedCourses = [];
          this.showBulkActions = false;
          this.loadCourses();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error(error.message || 'Failed to delete courses');
      }
    });
  }
  
  bulkRestoreCourses(): void {
    this.adminCourseService.bulkRestoreCourses(this.selectedCourses).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`Successfully restored ${this.selectedCourses.length} courses`);
          this.selectedCourses = [];
          this.showBulkActions = false;
          this.loadCourses();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error(error.message || 'Failed to restore courses');
      }
    });
  }
  
  bulkUpdateStatus(status: string): void {
    this.adminCourseService.bulkUpdateCourses(this.selectedCourses, { status }).subscribe({
      next: (response) => {
        if (response.success) {
          console.log(`Successfully updated ${this.selectedCourses.length} courses to ${status}`);
          this.selectedCourses = [];
          this.showBulkActions = false;
          this.loadCourses();
          this.loadStats();
        }
      },
      error: (error) => {
        console.error(error.message || 'Failed to update courses');
      }
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
    this.adminCourseService.exportCourses(format, this.activeTab === 'deleted').subscribe({
      next: (blob: Blob) => {
        const filename = `courses_${new Date().toISOString().split('T')[0]}.${format}`;
        this.adminCourseService.downloadExport(blob, filename);
        console.log('Courses exported successfully!');
      },
      error: (error: any) => {
        console.error('Failed to export courses');
      }
    });
  }
}
