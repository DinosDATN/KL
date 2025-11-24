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
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  Contest,
  ContestFilters,
  CreateContestRequest,
} from '../../../core/models/contest.model';
import { ContestService } from '../../../core/services/contest.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { CreatorContestFormComponent } from './components/creator-contest-form/creator-contest-form.component';

interface ContestStats {
  total_contests: number;
  active_contests: number;
  upcoming_contests: number;
  completed_contests: number;
  total_participants: number;
  total_problems: number;
}

@Component({
  selector: 'app-creator-contest-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CreatorContestFormComponent,
  ],
  templateUrl: './creator-contest-management.component.html',
  styleUrls: ['./creator-contest-management.component.css'],
})
export class CreatorContestManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  contests: Contest[] = [];
  stats: ContestStats | null = null;
  loading = false;
  error: string | null = null;

  // UI State
  activeTab: 'all' | 'active' | 'upcoming' | 'completed' = 'all';
  showCreateModal = false;
  editingContest: Contest | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  searchTerm = '';
  sortBy = 'start_time';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private contestService: ContestService,
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
    this.loadContests();
    this.loadStatistics();
  }

  loadContests(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.loading = false;
      return;
    }

    const filters: ContestFilters = {
      created_by: currentUser.id,
      status: this.activeTab === 'all' ? undefined : this.activeTab,
    };

    this.contestService
      .getAllContests(this.currentPage, this.itemsPerPage, filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.contests = response.data;
            if (response.pagination) {
              this.currentPage = response.pagination.current_page;
              this.totalPages = response.pagination.total_pages;
              this.totalItems = response.pagination.total_items;
              this.itemsPerPage = response.pagination.items_per_page;
            }
          } else {
            this.contests = [];
          }
        },
        error: (error) => {
          this.error = error.message || 'Không thể tải danh sách cuộc thi';
          this.notificationService.error(
            'Lỗi',
            'Không thể tải danh sách cuộc thi'
          );
        },
      });
  }

  loadStatistics(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const filters: ContestFilters = {
      created_by: currentUser.id,
    };

    // Load all contests to calculate stats
    this.contestService
      .getAllContests(1, 1000, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const allContests = response.data;
            const now = new Date();

            this.stats = {
              total_contests: allContests.length,
              active_contests: allContests.filter(
                (c) =>
                  new Date(c.start_time) <= now &&
                  new Date(c.end_time) > now
              ).length,
              upcoming_contests: allContests.filter(
                (c) => new Date(c.start_time) > now
              ).length,
              completed_contests: allContests.filter(
                (c) => new Date(c.end_time) < now
              ).length,
              total_participants: allContests.reduce(
                (sum, c) => sum + (c.participant_count || 0),
                0
              ),
              total_problems: allContests.reduce(
                (sum, c) => sum + (c.problem_count || 0),
                0
              ),
            };
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('[CreatorContestManagement] Error loading statistics:', error);
          this.stats = {
            total_contests: 0,
            active_contests: 0,
            upcoming_contests: 0,
            completed_contests: 0,
            total_participants: 0,
            total_problems: 0,
          };
          this.cdr.detectChanges();
        },
      });
  }

  onTabChange(tab: 'all' | 'active' | 'upcoming' | 'completed'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadContests();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadContests();
  }

  onSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.loadContests();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadContests();
  }

  openCreateModal(event?: Event): void {
    try {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.editingContest = null;
      this.showCreateModal = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error opening create modal:', error);
      this.notificationService.error('Lỗi', 'Không thể mở form tạo cuộc thi');
    }
  }

  openEditModal(contest: Contest): void {
    this.loading = true;
    this.contestService
      .getContestById(contest.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.editingContest = response.data;
            this.showCreateModal = true;
          } else {
            this.notificationService.error(
              'Lỗi',
              response.message || 'Không thể tải thông tin cuộc thi'
            );
          }
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.message || 'Không thể tải thông tin cuộc thi'
          );
        },
      });
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.editingContest = null;
  }

  onContestCreated(contest: Contest): void {
    this.closeModal();
    this.loadContests();
    this.loadStatistics();
    this.notificationService.success('Thành công', 'Tạo cuộc thi thành công!');
  }

  onContestUpdated(contest: Contest): void {
    this.closeModal();
    this.loadContests();
    this.loadStatistics();
    this.notificationService.success(
      'Thành công',
      'Cập nhật cuộc thi thành công!'
    );
  }

  onDeleteContest(contest: Contest): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa cuộc thi "${contest.title}"?`)) {
      return;
    }

    this.loading = true;
    this.contestService
      .deleteContest(contest.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success(
              'Thành công',
              'Xóa cuộc thi thành công!'
            );
            this.loadContests();
            this.loadStatistics();
          } else {
            this.notificationService.error(
              'Lỗi',
              response.message || 'Không thể xóa cuộc thi'
            );
          }
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.error?.message || 'Không thể xóa cuộc thi'
          );
        },
      });
  }

  viewContest(contest: Contest): void {
    this.router.navigate(['/contests', contest.id]);
  }

  editContest(contest: Contest): void {
    this.openEditModal(contest);
  }

  manageProblems(contest: Contest): void {
    this.router.navigate(['/contests', contest.id]);
  }

  viewLeaderboard(contest: Contest): void {
    this.router.navigate(['/contests', contest.id, 'leaderboard']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'active':
        return 'Đang diễn ra';
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return status || 'N/A';
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Filter contests by search term
  get filteredContests(): Contest[] {
    if (!this.searchTerm.trim()) {
      return this.contests;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.contests.filter(
      (contest) =>
        contest.title.toLowerCase().includes(term) ||
        (contest.description &&
          contest.description.toLowerCase().includes(term))
    );
  }
}

