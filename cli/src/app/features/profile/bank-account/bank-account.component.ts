import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreatorBankAccountService, BankAccount } from '../../../core/services/creator-bank-account.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-bank-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-account.component.html',
  styleUrls: ['./bank-account.component.css']
})
export class BankAccountComponent implements OnInit {
  bankAccount: BankAccount = {
    bank_name: '',
    account_number: '',
    account_name: '',
    branch: '',
    notes: ''
  };

  isLoading: boolean = true;
  isSaving: boolean = false;
  isEditing: boolean = false;
  hasExistingAccount: boolean = false;
  errorMessage: string = '';

  // Danh sách ngân hàng phổ biến tại Việt Nam
  popularBanks = [
    'Vietcombank',
    'BIDV',
    'VietinBank',
    'Agribank',
    'Techcombank',
    'MB Bank',
    'ACB',
    'VPBank',
    'TPBank',
    'Sacombank',
    'HDBank',
    'SHB',
    'VIB',
    'MSB',
    'OCB',
    'SeABank',
    'LienVietPostBank',
    'BacABank',
    'PVcomBank',
    'NCB'
  ];

  constructor(
    private bankAccountService: CreatorBankAccountService,
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
        'Chỉ creator mới có thể quản lý tài khoản ngân hàng'
      );
      this.router.navigate(['/']);
      return;
    }

    this.loadBankAccount();
  }

  loadBankAccount(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bankAccountService.getMyBankAccount().subscribe({
      next: (account) => {
        this.bankAccount = account;
        this.hasExistingAccount = true;
        this.isLoading = false;
      },
      error: (error) => {
        // Nếu chưa có tài khoản, cho phép tạo mới
        if (error.status === 404) {
          this.hasExistingAccount = false;
          this.isEditing = true;
        } else {
          this.errorMessage = error.error?.message || 'Không thể tải thông tin tài khoản ngân hàng';
        }
        this.isLoading = false;
      }
    });
  }

  enableEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    if (this.hasExistingAccount) {
      this.isEditing = false;
      this.loadBankAccount();
    } else {
      this.router.navigate(['/profile']);
    }
  }

  saveBankAccount(): void {
    // Validate
    if (!this.bankAccount.bank_name || !this.bankAccount.account_number || !this.bankAccount.account_name) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin bắt buộc';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.bankAccountService.upsertBankAccount(this.bankAccount).subscribe({
      next: (response) => {
        this.notificationService.success(
          'Thành công',
          response.message || 'Lưu thông tin tài khoản ngân hàng thành công'
        );
        this.hasExistingAccount = true;
        this.isEditing = false;
        this.isSaving = false;
        this.loadBankAccount();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể lưu thông tin tài khoản ngân hàng';
        this.isSaving = false;
      }
    });
  }

  deleteBankAccount(): void {
    if (!confirm('Bạn có chắc chắn muốn xóa thông tin tài khoản ngân hàng?')) {
      return;
    }

    this.bankAccountService.deleteBankAccount().subscribe({
      next: () => {
        this.notificationService.success(
          'Thành công',
          'Xóa thông tin tài khoản ngân hàng thành công'
        );
        this.hasExistingAccount = false;
        this.isEditing = true;
        this.bankAccount = {
          bank_name: '',
          account_number: '',
          account_name: '',
          branch: '',
          notes: ''
        };
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể xóa thông tin tài khoản ngân hàng'
        );
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
}
