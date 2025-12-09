import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CoursesService } from '../../../core/services/courses.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-course-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-payment.component.html',
  styleUrls: ['./course-payment.component.css']
})
export class CoursePaymentComponent implements OnInit {
  courseId: number = 0;
  course: any = null;
  
  originalAmount: number = 0;
  discountAmount: number = 0;
  finalAmount: number = 0;
  
  couponCode: string = '';
  appliedCoupon: any = null;
  paymentMethod: string = 'vnpay';
  
  isLoading: boolean = true;
  isProcessing: boolean = false;
  isApplyingCoupon: boolean = false;
  errorMessage: string = '';
  
  paymentMethods = [
    // { value: 'vnpay', label: 'VNPay', icon: '💳' },
    // { value: 'momo', label: 'MoMo', icon: '📱' },
    // { value: 'zalopay', label: 'ZaloPay', icon: '💰' },
    { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService,
    private authService: AuthService,
    public themeService: ThemeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.courseId = +this.route.snapshot.params['id'];
    this.paymentMethod = 'bank_transfer'; // Mặc định chọn chuyển khoản
    this.loadCourse();
  }

  loadCourse(): void {
    this.isLoading = true;
    this.coursesService.getCourseDetails(this.courseId).subscribe({
      next: (response: any) => {
        this.course = response.course;
        this.originalAmount = this.course.price || this.course.original_price || 0;
        this.finalAmount = this.originalAmount;
        this.isLoading = false;

        if (this.originalAmount === 0) {
          this.errorMessage = 'Khóa học này miễn phí';
          setTimeout(() => {
            this.router.navigate(['/courses', this.courseId]);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error loading course:', error);
        this.errorMessage = 'Không thể tải thông tin khóa học';
        this.isLoading = false;
      }
    });
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      return;
    }

    this.isApplyingCoupon = true;
    this.errorMessage = '';

    this.coursesService.validateCoupon(
      this.couponCode.trim().toUpperCase(),
      this.courseId,
      this.originalAmount
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.appliedCoupon = response.data.coupon;
          this.discountAmount = response.data.discountAmount;
          this.finalAmount = response.data.finalAmount;
          this.isApplyingCoupon = false;
        }
      },
      error: (error) => {
        console.error('Error validating coupon:', error);
        this.errorMessage = error.message || 'Mã giảm giá không hợp lệ';
        this.isApplyingCoupon = false;
      }
    });
  }

  removeCoupon(): void {
    this.couponCode = '';
    this.appliedCoupon = null;
    this.discountAmount = 0;
    this.finalAmount = this.originalAmount;
    this.errorMessage = '';
  }

  processPayment(): void {
    if (!this.paymentMethod) {
      this.errorMessage = 'Vui lòng chọn phương thức thanh toán';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    const paymentData = {
      paymentMethod: this.paymentMethod,
      couponCode: this.appliedCoupon ? this.couponCode.trim().toUpperCase() : undefined
    };

    this.coursesService.processPayment(this.courseId, paymentData).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Xử lý theo phương thức thanh toán
          if (this.paymentMethod === 'vnpay' && response.data.paymentUrl) {
            // Chuyển hướng đến VNPay
            window.location.href = response.data.paymentUrl;
          } else if (this.paymentMethod === 'bank_transfer' && response.data.bankInfo) {
            // Hiển thị thông tin chuyển khoản
            this.showBankTransferInfo(response.data);
          } else {
            // Thanh toán thành công trực tiếp
            this.notificationService.success(
              'Thanh toán thành công',
              'Bạn đã thanh toán khóa học thành công!'
            );
            this.router.navigate([response.data.redirectUrl || `/courses/${this.courseId}/learn`]);
          }
        }
      },
      error: (error) => {
        console.error('Error processing payment:', error);
        this.errorMessage = error.message || 'Thanh toán thất bại. Vui lòng thử lại.';
        this.isProcessing = false;
      }
    });
  }

  showBankTransferInfo(data: any): void {
    // Chuyển đến trang hiển thị thông tin chuyển khoản
    // Không còn paymentId vì chưa tạo payment
    this.router.navigate(['/payment/bank-transfer', this.courseId], {
      state: { 
        courseId: data.courseId,
        userId: data.userId,
        amount: data.amount,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
        couponCode: data.couponCode,
        bankInfo: data.bankInfo, 
        note: data.note 
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  goBack(): void {
    this.router.navigate(['/courses', this.courseId]);
  }
}
