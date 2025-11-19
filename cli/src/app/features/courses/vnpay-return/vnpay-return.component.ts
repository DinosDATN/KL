import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CoursesService } from '../../../core/services/courses.service';

@Component({
  selector: 'app-vnpay-return',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vnpay-return.component.html',
  styleUrls: ['./vnpay-return.component.css']
})
export class VnpayReturnComponent implements OnInit {
  isProcessing: boolean = true;
  isSuccess: boolean = false;
  message: string = '';
  redirectUrl: string = '';
  countdown: number = 5;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService
  ) {}

  ngOnInit(): void {
    // Lấy tất cả query params từ VNPay
    this.route.queryParams.subscribe(params => {
      this.processVnpayReturn(params);
    });
  }

  processVnpayReturn(params: any): void {
    this.coursesService.vnpayReturn(params).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.isSuccess = response.success;
        this.message = response.message;
        this.redirectUrl = response.data?.redirectUrl || '/courses';
        
        if (this.isSuccess) {
          this.startCountdown();
        }
      },
      error: (error: any) => {
        this.isProcessing = false;
        this.isSuccess = false;
        this.message = error.message || 'Có lỗi xảy ra khi xử lý thanh toán';
      }
    });
  }

  startCountdown(): void {
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.router.navigate([this.redirectUrl]);
      }
    }, 1000);
  }

  goToRedirectUrl(): void {
    this.router.navigate([this.redirectUrl]);
  }

  goToCourses(): void {
    this.router.navigate(['/courses']);
  }
}
