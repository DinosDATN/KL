import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AdminProblem,
  ProblemFilters,
  ProblemStats,
  AdminService,
} from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { BaseAdminComponent } from '../base-admin.component';
import { ThemeService } from '../../../core/services/theme.service';
import { ProblemFiltersComponent } from './components/problem-filters/problem-filters.component';

@Component({
  selector: 'app-problem-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    ProblemFiltersComponent,
  ],
  templateUrl: './problem-management.component.html',
  styleUrls: ['./problem-management.component.css']
})
export class ProblemManagementComponent extends BaseAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  problems: AdminProblem[] = [];
  stats: ProblemStats | null = null;
  selectedProblems: number[] = [];
  loading = false;
  error: string | null = null;

  // UI State
  activeTab: 'all' | 'deleted' | 'create' = 'all';
  showBulkActions = false;
  isFormModalOpen = false;
  editingProblem: AdminProblem | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  filters: ProblemFilters = {
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    difficulty: undefined,
    category_id: undefined,
    is_premium: undefined,
    is_popular: undefined,
    is_new: undefined,
    acceptance_range: undefined,
    created_by: undefined,
  };

  searchTerm = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    authService: AuthService,
    router: Router,
    public themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
  }

  ngOnInit(): void {
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        this.loadInitialData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loadProblems();
    this.loadStats();
  }

  loadProblems(): void {
    if (!this.isBrowser) {
      return;
    }

    this.loading = true;
    this.error = null;

    const filtersWithDeletedFlag: ProblemFilters = {
      ...this.filters,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };

    const service = this.activeTab === 'deleted'
      ? this.adminService.getDeletedProblems(filtersWithDeletedFlag)
      : this.adminService.getProblems(filtersWithDeletedFlag);

    service
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          console.log('Problems response:', response);
          this.problems = response.problems || [];
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.total_pages;
          this.totalItems = response.pagination.total_items;
          this.itemsPerPage = response.pagination.items_per_page;
          console.log('Problems loaded:', this.problems.length);
        },
        error: (error) => {
          console.error('Error loading problems:', error);
          this.error = error.message || 'Failed to load problems';
          this.notificationService.error('Error', this.error || 'Failed to load problems');
        }
      });
  }

  loadStats(): void {
    if (!this.isBrowser) {
      return;
    }

    this.adminService.getProblemStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          if (error.status === 401) {
            this.notificationService.error('Session expired', 'Please login again.');
            this.router.navigate(['/auth/login']);
          }
        }
      });
  }

  onTabChange(tab: 'all' | 'deleted' | 'create'): void {
    if (tab === 'create') {
      this.openCreateModal();
      return;
    }

    this.activeTab = tab;
    this.selectedProblems = [];
    this.showBulkActions = false;
    this.currentPage = 1;
    
    this.filters = {
      ...this.filters,
      page: 1,
      is_deleted: tab === 'deleted' ? true : false,
    };
    
    this.loadProblems();
  }

  onFiltersChange(newFilters: ProblemFilters): void {
    // Preserve is_deleted filter based on active tab
    this.filters = { 
      ...this.filters, 
      ...newFilters, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.itemsPerPage = newFilters.limit || this.itemsPerPage;
    this.loadProblems();
  }

  onSearch(): void {
    this.filters = { 
      ...this.filters, 
      search: this.searchTerm, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.loadProblems();
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
    this.loadProblems();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.filters = {
      ...this.filters,
      page: page,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.loadProblems();
  }

  onSelectProblem(problemId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedProblems.push(problemId);
    } else {
      this.selectedProblems = this.selectedProblems.filter(id => id !== problemId);
    }
    this.showBulkActions = this.selectedProblems.length > 0;
  }

  onSelectAll(selectAll: boolean): void {
    if (selectAll) {
      this.selectedProblems = this.problems.map((p) => p.id);
    } else {
      this.selectedProblems = [];
    }
    this.showBulkActions = this.selectedProblems.length > 0;
  }

  onProblemToggle(event: { problemId: number; selected: boolean }): void {
    if (event.selected) {
      this.selectedProblems = [...this.selectedProblems, event.problemId];
    } else {
      this.selectedProblems = this.selectedProblems.filter(
        (id) => id !== event.problemId
      );
    }
    this.showBulkActions = this.selectedProblems.length > 0;
  }

  onProblemSelect(problemIds: number[]): void {
    this.selectedProblems = problemIds;
    this.showBulkActions = problemIds.length > 0;
  }

  onBulkAction(action: string): void {
    if (this.selectedProblems.length === 0) return;

    switch (action) {
      case 'delete':
        this.onBulkDelete();
        break;
      case 'restore':
        this.onBulkRestore();
        break;
    }
  }

  onViewProblem(problem: AdminProblem): void {
    // Navigate to problem detail page
    this.router.navigate(['/problems', problem.id]);
  }

  onEditProblem(problem: AdminProblem): void {
    // Load full problem details from API to ensure we have the latest data
    this.loading = true;
    this.adminService.getProblemById(problem.id).subscribe({
      next: (response) => {
        if (response) {
          this.editingProblem = response;
          this.isFormModalOpen = true;
        } else {
          this.notificationService.error('Error', 'Failed to load problem details');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading problem:', error);
        // Fallback to using the problem data we already have
        this.editingProblem = problem;
        this.isFormModalOpen = true;
        this.loading = false;
        this.notificationService.warning('Warning', 'Using cached problem data. Some information may be outdated.');
      },
    });
  }

  onSortChange(event: { sortBy: string; order: 'asc' | 'desc' }): void {
    this.sortBy = event.sortBy;
    this.sortOrder = event.order;

    this.filters = {
      ...this.filters,
      sortBy: `${event.sortBy}_${event.order}`,
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.loadProblems();
  }

  onProblemCreated(problem: AdminProblem): void {
    console.log('Problem created successfully!');
    this.closeFormModal();
    this.loadProblems();
    this.loadStats();
  }

  onProblemUpdated(problem: AdminProblem): void {
    console.log('Problem updated successfully!');
    this.closeFormModal();
    this.loadProblems();
    this.loadStats();
  }

  openEditModal(problem: AdminProblem): void {
    this.onEditProblem(problem);
  }

  openCreateModal(): void {
    this.editingProblem = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.editingProblem = null;
  }

  deleteProblem(problemId: number): void {
    if (!confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    this.adminService.deleteProblem(problemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Problem deleted successfully');
          this.loadProblems();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error deleting problem:', error);
          this.notificationService.error('Error', error.message || 'Failed to delete problem');
        }
      });
  }

  restoreProblem(problemId: number): void {
    if (!confirm('Are you sure you want to restore this problem?')) {
      return;
    }

    this.adminService.restoreProblem(problemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Problem restored successfully');
          if (this.activeTab === 'deleted') {
            this.activeTab = 'all';
            this.filters = {
              ...this.filters,
              is_deleted: false,
              page: 1
            };
            this.currentPage = 1;
          }
          this.loadProblems();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error restoring problem:', error);
          this.notificationService.error('Error', error.message || 'Failed to restore problem');
        }
      });
  }

  permanentlyDeleteProblem(problemId: number): void {
    if (!confirm('Are you sure you want to permanently delete this problem? This action cannot be undone.')) {
      return;
    }

    this.adminService.permanentlyDeleteProblem(problemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Problem permanently deleted');
          this.loadProblems();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error permanently deleting problem:', error);
          this.notificationService.error('Error', error.message || 'Failed to permanently delete problem');
        }
      });
  }

  onBulkDelete(): void {
    if (this.selectedProblems.length === 0) {
      return;
    }

    const isPermanent = this.activeTab === 'deleted';
    const message = isPermanent
      ? `Are you sure you want to PERMANENTLY delete ${this.selectedProblems.length} problems? This action cannot be undone.`
      : `Are you sure you want to delete ${this.selectedProblems.length} problems?`;

    if (!confirm(message)) {
      return;
    }

    // For now, delete one by one (can be optimized with bulk delete endpoint)
    const deletePromises = this.selectedProblems.map(id => 
      isPermanent 
        ? this.adminService.permanentlyDeleteProblem(id).toPromise()
        : this.adminService.deleteProblem(id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.notificationService.success('Success', `${this.selectedProblems.length} problem(s) deleted successfully`);
        this.selectedProblems = [];
        this.showBulkActions = false;
        this.loadProblems();
        this.loadStats();
      })
      .catch((error) => {
        console.error('Error bulk deleting problems:', error);
        this.notificationService.error('Error', error.message || 'Failed to delete problems');
      });
  }

  onBulkRestore(): void {
    if (this.selectedProblems.length === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to restore ${this.selectedProblems.length} problems?`)) {
      return;
    }

    // Restore one by one (can be optimized with bulk restore endpoint)
    const restorePromises = this.selectedProblems.map(id => 
      this.adminService.restoreProblem(id).toPromise()
    );

    Promise.all(restorePromises)
      .then(() => {
        this.notificationService.success('Success', `${this.selectedProblems.length} problem(s) restored successfully`);
        this.selectedProblems = [];
        this.showBulkActions = false;
        if (this.activeTab === 'deleted') {
          this.activeTab = 'all';
          this.filters = {
            ...this.filters,
            is_deleted: false,
            page: 1
          };
          this.currentPage = 1;
        }
        this.loadProblems();
        this.loadStats();
      })
      .catch((error) => {
        console.error('Error bulk restoring problems:', error);
        this.notificationService.error('Error', error.message || 'Failed to restore problems');
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatNumber(value: unknown): string {
    const num = Number(value);
    if (isNaN(num) || num === null || num === undefined) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
