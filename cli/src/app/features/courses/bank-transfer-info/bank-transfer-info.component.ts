import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CoursesService } from '../../../core/services/courses.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-bank-transfer-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bank-transfer-info.component.html',
  styleUrls: ['./bank-transfer-info.component.css']
})
export class BankTransferInfoComponent implements OnInit {
  courseId: number = 0;
  userId: number = 0;
  amount: number = 0;
  originalAmount: number = 0;
  discountAmount: number = 0;
  couponCode: string = '';
  bankInfo: any = null;
  note: string = '';
  copied: boolean = false;
  isConfirming: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService,
    private notificationService: NotificationService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { 
      courseId: number;
      userId: number;
      amount: number;
      originalAmount: number;
      discountAmount: number;
      couponCode: string;
      bankInfo: any; 
      note: string;
    };
    
    if (state) {
      this.courseId = state.courseId;
      this.userId = state.userId;
      this.amount = state.amount;
      this.originalAmount = state.originalAmount;
      this.discountAmount = state.discountAmount;
      this.couponCode = state.couponCode;
      this.bankInfo = state.bankInfo;
      this.note = state.note;
    }
  }

  ngOnInit(): void {
    if (!this.bankInfo || !this.courseId) {
      this.router.navigate(['/courses']);
    }
  }

  copyToClipboard(text: string, field: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  confirmBankTransfer(): void {
    if (this.isConfirming) return;

    if (!confirm('Bạn đã chuyển khoản thành công? Sau khi xác nhận, giảng viên sẽ kiểm tra và cấp quyền truy cập cho bạn.')) {
      return;
    }

    this.isConfirming = true;

    const data = {
      amount: this.amount,
      originalAmount: this.originalAmount,
      discountAmount: this.discountAmount,
      couponCode: this.couponCode
    };

    this.coursesService.confirmBankTransferByUser(this.courseId, data).subscribe({
      next: (response: any) => {
        this.notificationService.success(
          'Thành công',
          'Đã ghi nhận thanh toán của bạn! Vui lòng chờ giảng viên xác nhận.'
        );
        this.router.navigate(['/courses', this.courseId]);
      },
      error: (error: any) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
        );
        this.isConfirming = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/courses']);
  }
}
