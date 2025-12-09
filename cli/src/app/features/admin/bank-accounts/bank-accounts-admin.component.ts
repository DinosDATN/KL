import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreatorBankAccountService, BankAccount } from '../../../core/services/creator-bank-account.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface BankAccountWithUser extends BankAccount {
  User?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

@Component({
  selector: 'app-bank-accounts-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-accounts-admin.component.html',
  styleUrls: ['./bank-accounts-admin.component.css']
})
export class BankAccountsAdminComponent implements OnInit {
  bankAccounts: BankAccountWithUser[] = [];
  filteredAccounts: BankAccountWithUser[] = [];
  
  isLoading: boolean = true;
  isProcessing: boolean = false;
  errorMessage: string = '';
  
  // Filters
  filterStatus: string = 'all'; // all, verified, pending
  searchQuery: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  constructor(
    private bankAccountService: CreatorBankAccountService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Kiểm tra user có phải admin không
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.notificationService.error(
        'Không có quyền truy cập',
        'Chỉ admin mới có thể quản lý tài khoản ngân hàng'
      );
      this.router.navigate(['/']);
      return;
    }

    this.loadBankAccounts();
  }

  loadBankAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bankAccountService.getAllBankAccounts().subscribe({
      next: (accounts) => {
        this.bankAccounts = accounts as BankAccountWithUser[];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể tải danh sách tài khoản ngân hàng';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.bankAccounts];

    // Filter by status
    if (this.filterStatus === 'verified') {
      filtered = filtered.filter(acc => acc.is_verified);
    } else if (this.filterStatus === 'pending') {
      filtered = filtered.filter(acc => !acc.is_verified);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.User?.name.toLowerCase().includes(query) ||
        acc.User?.email.toLowerCase().includes(query) ||
        acc.bank_name.toLowerCase().includes(query) ||
        acc.account_name.toLowerCase().includes(query)
      );
    }

    this.filteredAccounts = filtered;
    this.totalPages = Math.ceil(this.filteredAccounts.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getPaginatedAccounts(): BankAccountWithUser[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAccounts.slice(startIndex, endIndex);
  }

  verifyAccount(account: BankAccountWithUser): void {
    if (!confirm(`Bạn có chắc chắn muốn xác thực tài khoản ngân hàng của ${account.User?.name}?`)) {
      return;
    }

    this.isProcessing = true;

    this.bankAccountService.verifyBankAccount(account.id!, true).subscribe({
      next: (response) => {
        this.notificationService.success(
          'Thành công',
          'Xác thực tài khoản ngân hàng thành công'
        );
        this.loadBankAccounts();
        this.isProcessing = false;
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể xác thực tài khoản ngân hàng'
        );
        this.isProcessing = false;
      }
    });
  }

  unverifyAccount(account: BankAccountWithUser): void {
    if (!confirm(`Bạn có chắc chắn muốn hủy xác thực tài khoản ngân hàng của ${account.User?.name}?`)) {
      return;
    }

    this.isProcessing = true;

    this.bankAccountService.verifyBankAccount(account.id!, false).subscribe({
      next: (response) => {
        this.notificationService.success(
          'Thành công',
          'Hủy xác thực tài khoản ngân hàng thành công'
        );
        this.loadBankAccounts();
        this.isProcessing = false;
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể hủy xác thực tài khoản ngân hàng'
        );
        this.isProcessing = false;
      }
    });
  }

  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length <= 4) {
      return accountNumber;
    }
    const lastFour = accountNumber.slice(-4);
    return '*'.repeat(accountNumber.length - 4) + lastFour;
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

  onFilterChange(): void {
    this.applyFilters();
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

  getStatusBadgeClass(account: BankAccountWithUser): string {
    if (account.is_verified) {
      return 'badge-success';
    }
    return 'badge-warning';
  }

  getStatusText(account: BankAccountWithUser): string {
    if (account.is_verified) {
      return 'Đã xác thực';
    }
    return 'Chờ xác thực';
  }

  getTotalVerified(): number {
    return this.bankAccounts.filter(acc => acc.is_verified).length;
  }

  getTotalPending(): number {
    return this.bankAccounts.filter(acc => !acc.is_verified).length;
  }

  getTotalActive(): number {
    return this.bankAccounts.filter(acc => acc.is_active).length;
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredAccounts.length);
    return `${start} - ${end}`;
  }
}
