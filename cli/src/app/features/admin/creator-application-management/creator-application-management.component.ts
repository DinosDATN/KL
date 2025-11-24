import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { CreatorApplicationService, PaginationInfo } from '../../../core/services/creator-application.service';
import { CreatorApplication } from '../../../core/models/creator-application.model';
import { NotificationService } from '../../../core/services/notification.service';
import { BaseAdminComponent } from '../base-admin.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { PLATFORM_ID, Inject } from '@angular/core';

@Component({
  selector: 'app-creator-application-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './creator-application-management.component.html',
  styleUrls: ['./creator-application-management.component.css']
})
export class CreatorApplicationManagementComponent extends BaseAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  applications: CreatorApplication[] = [];
  selectedApplication: CreatorApplication | null = null;
  isLoading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  pagination: PaginationInfo | null = null;

  // Filters
  statusFilter: 'pending' | 'approved' | 'rejected' | '' = '';
  searchTerm = '';

  // Modal states
  showDetailModal = false;
  showRejectModal = false;
  rejectionForm: FormGroup;

  statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Đã từ chối' }
  ];

  constructor(
    private creatorApplicationService: CreatorApplicationService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    authService: AuthService,
    router: Router,
    public themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(authService, router, platformId);
    this.rejectionForm = this.fb.group({
      rejection_reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.error = null;

    this.creatorApplicationService
      .getAllApplications({
        page: this.currentPage,
        limit: this.itemsPerPage,
        status: this.statusFilter || undefined,
        search: this.searchTerm || undefined
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.applications = response.applications;
          this.pagination = response.pagination;
        },
        error: (error) => {
          this.error = error.error?.message || 'Không thể tải danh sách đơn đăng ký';
          this.notificationService.showError(this.error);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplications();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadApplications();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadApplications();
  }

  viewApplication(application: CreatorApplication): void {
    this.selectedApplication = application;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedApplication = null;
  }

  approveApplication(application: CreatorApplication): void {
    if (!confirm(`Bạn có chắc chắn muốn duyệt đơn đăng ký của ${application.User?.name}?`)) {
      return;
    }

    this.isLoading = true;
    this.creatorApplicationService
      .approveApplication(application.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (updatedApplication) => {
          this.notificationService.showSuccess('Đơn đăng ký đã được duyệt thành công');
          this.loadApplications();
          if (this.selectedApplication?.id === application.id) {
            this.selectedApplication = updatedApplication;
          }
          this.closeDetailModal();
        },
        error: (error) => {
          this.error = error.error?.message || 'Không thể duyệt đơn đăng ký';
          this.notificationService.showError(this.error);
        }
      });
  }

  openRejectModal(application: CreatorApplication): void {
    this.selectedApplication = application;
    this.rejectionForm.reset();
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedApplication = null;
    this.rejectionForm.reset();
  }

  rejectApplication(): void {
    if (this.rejectionForm.invalid || !this.selectedApplication) {
      return;
    }

    this.isLoading = true;
    this.creatorApplicationService
      .rejectApplication(
        this.selectedApplication.id,
        this.rejectionForm.value.rejection_reason
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (updatedApplication) => {
          this.notificationService.showSuccess('Đơn đăng ký đã bị từ chối');
          this.loadApplications();
          this.closeRejectModal();
          this.closeDetailModal();
        },
        error: (error) => {
          this.error = error.error?.message || 'Không thể từ chối đơn đăng ký';
          this.notificationService.showError(this.error);
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return status;
    }
  }
}

