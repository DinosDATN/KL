import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoursesService } from '../../../core/services/courses.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  payment_date?: string;
  created_at: string;
  User?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  Course?: {
    id: number;
    title: string;
    thumbnail?: string;
    price: number;
  };
}

@Component({
  selector: 'app-creator-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './creator-payments.component.html',
  styleUrls: ['./creator-payments.component.css']
})
export class CreatorPaymentsComponent implements OnInit {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  
  isLoading: boolean = true;
  isProcessing: boolean = false;
  errorMessage: string = '';
  
  // Filters
  filterStatus: string = 'pending'; // all, pending, completed
  searchQuery: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Confirm modal
  showConfirmModal: boolean = false;
  selectedPayment: Payment | null = null;
  transactionId: string = '';
  confirmNotes: string = '';

  constructor(
    private coursesService: CoursesService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Kiểm tra user có phải creator không
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'creator') {
      this.notificationService.error(
        'Không có quyền truy cập',
        'Chỉ creator mới có thể quản lý thanh toán'
      );
      this.router.navigate(['/']);
      return;
    }

    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // TODO: Tạo service method mới cho creator payments
    // Tạm thời dùng mock data hoặc gọi API trực tiếp
    this.coursesService.getCreatorPayments(this.filterStatus === 'all' ? '' : this.filterStatus).subscribe({
      next: (response: any) => {
        this.payments = response.data || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể tải danh sách thanh toán';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.payments];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(p => p.payment_status === this.filterStatus);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.User?.name.toLowerCase().includes(query) ||
        p.User?.email.toLowerCase().includes(query) ||
        p.Course?.title.toLowerCase().includes(query) ||
        p.transaction_id?.toLowerCase().includes(query)
      );
    }

    this.filteredPayments = filtered;
    this.totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getPaginatedPayments(): Payment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPayments.slice(startIndex, endIndex);
  }

  openConfirmModal(payment: Payment): void {
    this.selectedPayment = payment;
    this.transactionId = '';
    this.confirmNotes = '';
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedPayment = null;
    this.transactionId = '';
    this.confirmNotes = '';
  }

  confirmPayment(): void {
    if (!this.selectedPayment) return;

    this.isProcessing = true;

    const data = {
      transactionId: this.transactionId || undefined,
      notes: this.confirmNotes || undefined
    };

    this.coursesService.creatorConfirmPayment(this.selectedPayment.id, data).subscribe({
      next: (response: any) => {
        this.notificationService.success(
          'Thành công',
          'Xác nhận thanh toán thành công. Học viên đã có thể truy cập khóa học.'
        );
        this.closeConfirmModal();
        this.loadPayments();
        this.isProcessing = false;
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể xác nhận thanh toán'
        );
        this.isProcessing = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'failed':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  }

  getTotalPending(): number {
    return this.payments.filter(p => p.payment_status === 'pending').length;
  }

  getTotalCompleted(): number {
    return this.payments.filter(p => p.payment_status === 'completed').length;
  }

  getTotalAmount(): number {
    return this.payments
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  onFilterChange(): void {
    this.loadPayments();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredPayments.length);
    return `${start} - ${end}`;
  }
}
