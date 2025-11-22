import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  AdminContest,
  ContestFilters,
  ContestStats,
  AdminService,
} from '../../../core/services/admin.service';
import { ContestListComponent } from './components/contest-list/contest-list.component';
import { ContestFiltersComponent } from './components/contest-filters/contest-filters.component';
import { ContestStatsComponent } from './components/contest-stats/contest-stats.component';
import { BulkActionsComponent } from './components/bulk-actions/bulk-actions.component';
import { ContestFormComponent } from './components/contest-form/contest-form.component';
import { ContestProblemsComponent } from './components/contest-problems/contest-problems.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { BaseAdminComponent } from '../base-admin.component';

@Component({
  selector: 'app-contest-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ContestListComponent,
    ContestFiltersComponent,
    ContestStatsComponent,
    BulkActionsComponent,
    ContestFormComponent,
    ContestProblemsComponent,
  ],
  templateUrl: './contest-management.component.html',
  styleUrl: './contest-management.component.css',
})
export class ContestManagementComponent extends BaseAdminComponent implements OnInit {
  contests: AdminContest[] = [];
  stats: ContestStats | null = null;
  selectedContests: number[] = [];
  loading = false;
  error: string | null = null;

  // UI State
  activeTab: 'all' | 'deleted' | 'create' = 'all';
  showBulkActions = false;
  isFormModalOpen = false;
  isProblemsModalOpen = false;
  editingContest: AdminContest | null = null;
  managingProblemsContest: AdminContest | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  filters: ContestFilters = {
    page: 1,
    limit: 10,
    sortBy: 'start_time',
  };

  searchTerm = '';
  sortBy: 'title' | 'start_time' | 'end_time' | 'created_at' = 'start_time';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private adminService: AdminService,
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
    this.loadContests();
    this.loadStats();
  }

  loadContests(): void {
    // ✅ Skip during SSR
    if (!this.isBrowser) {
      return;
    }

    this.loading = true;
    this.error = null;

    const filtersWithSearch: ContestFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm || undefined,
      sortBy: this.sortBy as 'title' | 'start_time' | 'end_time' | 'created_at',
      is_deleted: this.activeTab === 'deleted' ? true : false,
    };

    this.adminService.getContests(filtersWithSearch).subscribe({
      next: (response) => {
        this.contests = response.contests;
        this.currentPage = response.pagination.current_page;
        this.totalPages = response.pagination.total_pages;
        this.totalItems = response.pagination.total_items;
        this.itemsPerPage = response.pagination.items_per_page;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load contests';
        this.loading = false;
        this.notificationService.error('Lỗi', this.error || undefined);
      },
    });
  }

  loadStats(): void {
    // ✅ Skip during SSR
    if (!this.isBrowser) {
      return;
    }

    this.adminService.getContestStatistics().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Failed to load statistics:', error);
      },
    });
  }

  onFiltersChange(filters: ContestFilters): void {
    this.filters = filters;
    this.currentPage = 1;
    this.loadContests();
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.loadContests();
  }

  onSortChange(sortData: { sortBy: string; order: 'asc' | 'desc' }): void {
    this.sortBy = sortData.sortBy as 'title' | 'start_time' | 'end_time' | 'created_at';
    this.sortOrder = sortData.order;
    this.loadContests();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadContests();
  }

  onContestToggle(data: { contestId: number; selected: boolean }): void {
    if (data.selected) {
      if (!this.selectedContests.includes(data.contestId)) {
        this.selectedContests.push(data.contestId);
      }
    } else {
      this.selectedContests = this.selectedContests.filter(
        (id) => id !== data.contestId
      );
    }
    this.showBulkActions = this.selectedContests.length > 0;
  }

  onSelectAll(selected: boolean): void {
    if (selected) {
      this.selectedContests = this.contests.map((c) => c.id);
    } else {
      this.selectedContests = [];
    }
    this.showBulkActions = this.selectedContests.length > 0;
  }

  onCreateContest(): void {
    this.editingContest = null;
    this.isFormModalOpen = true;
    this.activeTab = 'create';
  }

  onEditContest(contest: AdminContest): void {
    this.editingContest = contest;
    this.isFormModalOpen = true;
  }

  onViewContest(contest: AdminContest): void {
    // Navigate to contest detail page
    this.router.navigate(['/contests', contest.id]);
  }

  onContestCreated(contest: AdminContest): void {
    this.isFormModalOpen = false;
    this.activeTab = 'all';
    this.loadContests();
    this.loadStats();
  }

  onContestUpdated(contest: AdminContest): void {
    this.isFormModalOpen = false;
    this.editingContest = null;
    this.loadContests();
    this.loadStats();
  }

  onDeleteContest(contestId: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa cuộc thi này?')) {
      return;
    }

    this.adminService.deleteContest(contestId).subscribe({
      next: () => {
        this.notificationService.success('Thành công', 'Cuộc thi đã được xóa');
        this.loadContests();
        this.loadStats();
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể xóa cuộc thi'
        );
      },
    });
  }

  onRestoreContest(contestId: number): void {
    this.adminService.restoreContest(contestId).subscribe({
      next: () => {
        this.notificationService.success('Thành công', 'Cuộc thi đã được khôi phục');
        this.loadContests();
        this.loadStats();
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể khôi phục cuộc thi'
        );
      },
    });
  }

  onPermanentlyDeleteContest(contestId: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn cuộc thi này? Hành động này không thể hoàn tác!')) {
      return;
    }

    this.adminService.permanentlyDeleteContest(contestId).subscribe({
      next: () => {
        this.notificationService.success('Thành công', 'Cuộc thi đã được xóa vĩnh viễn');
        this.loadContests();
        this.loadStats();
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể xóa vĩnh viễn cuộc thi'
        );
      },
    });
  }

  onBulkDelete(): void {
    if (this.selectedContests.length === 0) {
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa ${this.selectedContests.length} cuộc thi đã chọn?`
      )
    ) {
      return;
    }

    // Delete contests one by one
    const deletePromises = this.selectedContests.map((id) =>
      this.adminService.deleteContest(id).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.notificationService.success(
          'Thành công',
          `Đã xóa ${this.selectedContests.length} cuộc thi`
        );
        this.selectedContests = [];
        this.showBulkActions = false;
        this.loadContests();
        this.loadStats();
      })
      .catch((error) => {
        this.notificationService.error('Lỗi', 'Không thể xóa một số cuộc thi');
      });
  }

  onBulkUpdate(updateData: Partial<AdminContest>): void {
    if (this.selectedContests.length === 0) {
      return;
    }

    this.adminService
      .bulkUpdateContests(this.selectedContests, updateData)
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            'Thành công',
            `Đã cập nhật ${response.updatedCount} cuộc thi`
          );
          this.selectedContests = [];
          this.showBulkActions = false;
          this.loadContests();
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.error?.message || 'Không thể cập nhật cuộc thi'
          );
        },
      });
  }

  onCloseForm(): void {
    this.isFormModalOpen = false;
    this.editingContest = null;
    this.activeTab = 'all';
  }

  onTabChange(tab: 'all' | 'deleted' | 'create'): void {
    this.activeTab = tab;
    if (tab === 'create') {
      this.onCreateContest();
    } else {
      this.isFormModalOpen = false;
      this.editingContest = null;
      this.currentPage = 1;
      this.loadContests();
    }
  }

  onManageProblems(contest: AdminContest): void {
    this.managingProblemsContest = contest;
    this.isProblemsModalOpen = true;
  }

  onProblemsUpdated(): void {
    this.loadContests();
  }

  onCloseProblemsModal(): void {
    this.isProblemsModalOpen = false;
    this.managingProblemsContest = null;
  }

  onExport(format: 'json' | 'csv'): void {
    this.adminService.exportContests(format, false).subscribe({
      next: (data) => {
        if (format === 'json') {
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contests-${new Date().toISOString()}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          const blob = new Blob([data as string], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contests-${new Date().toISOString()}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
        this.notificationService.success('Thành công', 'Đã xuất dữ liệu');
      },
      error: (error) => {
        this.notificationService.error('Lỗi', 'Không thể xuất dữ liệu');
      },
    });
  }
}
