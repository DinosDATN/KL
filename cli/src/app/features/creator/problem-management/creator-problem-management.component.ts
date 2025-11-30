import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
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
import { ThemeService } from '../../../core/services/theme.service';
import { ProblemFiltersComponent } from '../../admin/problem-management/components/problem-filters/problem-filters.component';
import { ProblemFormComponent } from '../../admin/problem-management/components/problem-form/problem-form.component';

@Component({
  selector: 'app-creator-problem-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    ProblemFiltersComponent,
    ProblemFormComponent,
  ],
  templateUrl: './creator-problem-management.component.html',
  styleUrls: ['./creator-problem-management.component.css']
})
export class CreatorProblemManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  problems: AdminProblem[] = [];
  allProblems: AdminProblem[] = []; // Store all problems (deleted + non-deleted) for stats calculation
  stats: ProblemStats | null = null;
  selectedProblems: number[] = [];
  loading = false;
  error: string | null = null;

  // UI State
  activeTab: 'all' | 'deleted' = 'all';
  showBulkActions = false;
  isFormModalOpen = false;
  editingProblem: AdminProblem | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters - always filter by current creator
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
    created_by: undefined, // Will be set to current user ID
  };

  searchTerm = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Expose Math for template
  Math = Math;
  isBrowser = false;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
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

    // Set created_by filter to current user
    if (currentUser) {
      this.filters.created_by = currentUser.id;
    }

    this.loadInitialData();
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
    this.problems = []; // Reset problems when starting to load to prevent showing old data

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.loading = false;
      return;
    }

    const filtersWithDeletedFlag: ProblemFilters = {
      ...this.filters,
      is_deleted: this.activeTab === 'deleted' ? true : false,
      created_by: currentUser.id, // Always filter by current creator
    };

    const service = this.activeTab === 'deleted'
      ? this.adminService.getDeletedProblems(filtersWithDeletedFlag)
      : this.adminService.getProblems(filtersWithDeletedFlag);

    service
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          this.problems = Array.isArray(response.problems) ? response.problems : [];
          this.currentPage = response.pagination?.current_page || 1;
          this.totalPages = response.pagination?.total_pages || 1;
          this.totalItems = response.pagination?.total_items || 0;
          this.itemsPerPage = response.pagination?.items_per_page || 10;
          this.calculateStatsFromProblems();
        },
        error: (error) => {
          this.problems = []; // Ensure it's always an array even on error
          this.error = error.message || 'Không thể tải danh sách bài tập';
          this.notificationService.error('Lỗi', this.error || undefined);
        },
      });
  }

  loadStats(): void {
    // For creator, load all problems (deleted + non-deleted) to calculate accurate stats
    if (!this.isBrowser) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Load both deleted and non-deleted problems separately, then combine
    const baseFilters: ProblemFilters = {
      created_by: currentUser.id,
      page: 1,
      limit: 1000, // Load a large number to get all problems for stats
    };

    // Load non-deleted problems
    const nonDeletedFilters: ProblemFilters = {
      ...baseFilters,
      is_deleted: false,
    };

    // Load deleted problems
    const deletedFilters: ProblemFilters = {
      ...baseFilters,
      is_deleted: true,
    };

    // Use forkJoin to load both in parallel
    forkJoin({
      nonDeleted: this.adminService.getProblems(nonDeletedFilters),
      deleted: this.adminService.getDeletedProblems(deletedFilters)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: {
          nonDeleted: { problems: AdminProblem[]; pagination: any };
          deleted: { problems: AdminProblem[]; pagination: any };
        }) => {
          // Combine both arrays
          this.allProblems = [
            ...(results.nonDeleted.problems || []),
            ...(results.deleted.problems || [])
          ];
          this.calculateStatsFromProblems();
        },
        error: (error: any) => {
          console.error('Error loading stats:', error);
          // Fallback to using current problems if stats load fails
          this.calculateStatsFromProblems();
        }
      });
  }

  private calculateStatsFromProblems(): void {
    // Use allProblems for stats calculation if available, otherwise fallback to problems
    const problemsForStats = this.allProblems.length > 0 ? this.allProblems : this.problems;
    const activeProblems = problemsForStats.filter(p => !p.is_deleted);
    const deletedProblems = problemsForStats.filter(p => p.is_deleted);
    
    const difficultyCounts = {
      Easy: activeProblems.filter(p => p.difficulty === 'Easy').length,
      Medium: activeProblems.filter(p => p.difficulty === 'Medium').length,
      Hard: activeProblems.filter(p => p.difficulty === 'Hard').length
    };

    const categoryMap = new Map<number, { category: { id: number; name: string }; count: number }>();
    activeProblems.forEach(problem => {
      if (problem.Category) {
        const categoryId = problem.Category.id;
        if (categoryMap.has(categoryId)) {
          categoryMap.get(categoryId)!.count++;
        } else {
          categoryMap.set(categoryId, {
            category: {
              id: categoryId,
              name: problem.Category.name
            },
            count: 1
          });
        }
      }
    });

    const totalSubmissions = activeProblems.reduce((sum, p) => sum + (p.total_submissions || 0), 0);
    const totalSolved = activeProblems.reduce((sum, p) => sum + (p.solved_count || 0), 0);
    const averageAcceptance = totalSubmissions > 0 
      ? ((totalSolved / totalSubmissions) * 100).toFixed(2) + '%'
      : '0%';

    this.stats = {
      totalProblems: problemsForStats.length,
      publishedProblems: activeProblems.length,
      deletedProblems: deletedProblems.length,
      problemsByDifficulty: [
        { difficulty: 'Easy', count: difficultyCounts.Easy },
        { difficulty: 'Medium', count: difficultyCounts.Medium },
        { difficulty: 'Hard', count: difficultyCounts.Hard }
      ],
      problemsByCategory: Array.from(categoryMap.values()),
      totalSubmissions: totalSubmissions,
      totalSolved: totalSolved,
      averageAcceptance: averageAcceptance,
      popularProblems: activeProblems.filter(p => p.is_popular).length,
      newProblems: activeProblems.filter(p => p.is_new).length,
      premiumProblems: activeProblems.filter(p => p.is_premium).length,
      growthRate: 0
    };
    this.cdr.markForCheck();
  }

  onTabChange(tab: 'all' | 'deleted'): void {
    this.activeTab = tab;
    this.selectedProblems = [];
    this.showBulkActions = false;
    this.currentPage = 1;
    
    const currentUser = this.authService.getCurrentUser();
    this.filters = {
      ...this.filters,
      page: 1,
      is_deleted: tab === 'deleted' ? true : false,
      created_by: currentUser?.id,
    };
    
    this.loadProblems();
  }

  onFiltersChange(newFilters: ProblemFilters): void {
    const currentUser = this.authService.getCurrentUser();
    this.filters = { 
      ...this.filters, 
      ...newFilters, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false,
      created_by: currentUser?.id, // Always preserve created_by
    };
    this.currentPage = 1;
    this.itemsPerPage = newFilters.limit || this.itemsPerPage;
    this.loadProblems();
  }

  onSearch(): void {
    const currentUser = this.authService.getCurrentUser();
    this.filters = { 
      ...this.filters, 
      search: this.searchTerm, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false,
      created_by: currentUser?.id,
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
    const currentUser = this.authService.getCurrentUser();
    this.filters = {
      ...this.filters,
      page: page,
      is_deleted: this.activeTab === 'deleted' ? true : false,
      created_by: currentUser?.id,
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

  onViewProblem(problem: AdminProblem): void {
    this.router.navigate(['/problems', problem.id]);
  }

  onEditProblem(problem: AdminProblem): void {
    this.loading = true;
    this.adminService.getProblemById(problem.id).subscribe({
      next: (response) => {
        if (response) {
          this.editingProblem = response;
          this.isFormModalOpen = true;
        } else {
          this.notificationService.error('Lỗi', 'Không thể tải chi tiết bài tập');
        }
        this.loading = false;
      },
      error: (error) => {
        this.editingProblem = problem;
        this.isFormModalOpen = true;
        this.loading = false;
        this.notificationService.warning('Cảnh báo', 'Sử dụng dữ liệu đã cache. Một số thông tin có thể không cập nhật.');
      },
    });
  }

  onProblemCreated(problem: AdminProblem): void {
    this.notificationService.success('Thành công', 'Tạo bài tập thành công!');
    this.closeFormModal();
    this.loadProblems();
    this.loadStats();
  }

  onProblemUpdated(problem: AdminProblem): void {
    this.notificationService.success('Thành công', 'Cập nhật bài tập thành công!');
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
    // Use confirmation toast instead of confirm()
    this.notificationService.confirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài tập này?',
      () => {
        // User confirmed
        this.adminService.deleteProblem(problemId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Thành công', 'Xóa bài tập thành công');
              // Reload problems to update the list
              // If on 'all' tab, the deleted problem will disappear
              // If on 'deleted' tab, the newly deleted problem will appear
              const currentUser = this.authService.getCurrentUser();
              this.filters = {
                ...this.filters,
                is_deleted: this.activeTab === 'deleted' ? true : false,
                page: 1,
                created_by: currentUser?.id,
              };
              this.currentPage = 1;
              this.loadProblems();
              this.loadStats();
            },
            error: (error) => {
              this.notificationService.error('Lỗi', error.message || 'Không thể xóa bài tập');
            }
          });
      }
    );
  }

  restoreProblem(problemId: number): void {
    this.notificationService.confirm(
      'Xác nhận khôi phục',
      'Bạn có chắc chắn muốn khôi phục bài tập này?',
      () => {
        // User confirmed
        this.adminService.restoreProblem(problemId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Thành công', 'Khôi phục bài tập thành công');
              if (this.activeTab === 'deleted') {
                this.activeTab = 'all';
                const currentUser = this.authService.getCurrentUser();
                this.filters = {
                  ...this.filters,
                  is_deleted: false,
                  page: 1,
                  created_by: currentUser?.id,
                };
                this.currentPage = 1;
              }
              this.loadProblems();
              this.loadStats();
            },
            error: (error) => {
              this.notificationService.error('Lỗi', error.message || 'Không thể khôi phục bài tập');
            }
          });
      }
    );
  }

  permanentlyDeleteProblem(problemId: number): void {
    this.notificationService.confirm(
      'Xác nhận xóa vĩnh viễn',
      'Bạn có chắc chắn muốn xóa vĩnh viễn bài tập này? Hành động này không thể hoàn tác.',
      () => {
        // User confirmed
        this.adminService.permanentlyDeleteProblem(problemId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.success('Thành công', 'Đã xóa vĩnh viễn bài tập');
              this.loadProblems();
              this.loadStats();
            },
            error: (error) => {
              this.notificationService.error('Lỗi', error.message || 'Không thể xóa vĩnh viễn bài tập');
            }
          });
      },
      undefined,
      'error'
    );
  }

  onBulkDelete(): void {
    if (this.selectedProblems.length === 0) {
      return;
    }

    const isPermanent = this.activeTab === 'deleted';
    const message = isPermanent
      ? `Bạn có chắc chắn muốn XÓA VĨNH VIỄN ${this.selectedProblems.length} bài tập? Hành động này không thể hoàn tác.`
      : `Bạn có chắc chắn muốn xóa ${this.selectedProblems.length} bài tập?`;

    this.notificationService.confirm(
      isPermanent ? 'Xác nhận xóa vĩnh viễn' : 'Xác nhận xóa',
      message,
      () => {
        // User confirmed
        const deletePromises = this.selectedProblems.map(id => 
          isPermanent 
            ? this.adminService.permanentlyDeleteProblem(id).toPromise()
            : this.adminService.deleteProblem(id).toPromise()
        );

        Promise.all(deletePromises)
          .then(() => {
            this.notificationService.success('Thành công', `Đã xóa ${this.selectedProblems.length} bài tập thành công`);
            this.selectedProblems = [];
            this.showBulkActions = false;
            this.loadProblems();
            this.loadStats();
          })
          .catch((error) => {
            this.notificationService.error('Lỗi', error.message || 'Không thể xóa bài tập');
          });
      },
      undefined,
      isPermanent ? 'error' : 'warning'
    );
  }

  onBulkRestore(): void {
    if (this.selectedProblems.length === 0) {
      return;
    }

    this.notificationService.confirm(
      'Xác nhận khôi phục',
      `Bạn có chắc chắn muốn khôi phục ${this.selectedProblems.length} bài tập?`,
      () => {
        // User confirmed
        const restorePromises = this.selectedProblems.map(id => 
          this.adminService.restoreProblem(id).toPromise()
        );

        Promise.all(restorePromises)
          .then(() => {
            this.notificationService.success('Thành công', `Đã khôi phục ${this.selectedProblems.length} bài tập thành công`);
            this.selectedProblems = [];
            this.showBulkActions = false;
            if (this.activeTab === 'deleted') {
              this.activeTab = 'all';
              const currentUser = this.authService.getCurrentUser();
              this.filters = {
                ...this.filters,
                is_deleted: false,
                page: 1,
                created_by: currentUser?.id,
              };
              this.currentPage = 1;
            }
            this.loadProblems();
            this.loadStats();
          })
          .catch((error) => {
            this.notificationService.error('Lỗi', error.message || 'Không thể khôi phục bài tập');
          });
      }
    );
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
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
