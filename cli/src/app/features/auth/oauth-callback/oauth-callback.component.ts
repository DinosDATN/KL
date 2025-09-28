import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {{ isProcessing ? 'Đang xử lý đăng nhập...' : (hasError ? 'Đăng nhập thất bại' : 'Đăng nhập thành công!') }}
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
              {{ statusMessage }}
            </p>
            <div *ngIf="hasError" class="mt-4">
              <button 
                (click)="goToLogin()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class OAuthCallbackComponent implements OnInit {
  isProcessing = true;
  hasError = false;
  statusMessage = 'Đang xử lý thông tin đăng nhập từ Google...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    try {
      const queryParams = this.route.snapshot.queryParams;
      console.log('OAuth callback query params:', queryParams);

      // Check for error parameter
      if (queryParams['error']) {
        this.handleError(queryParams['error']);
        return;
      }

      // Check for token and user data
      const token = queryParams['token'];
      const userDataStr = queryParams['user'];

      if (!token || !userDataStr) {
        this.handleError('missing_data');
        return;
      }

      try {
        const userData = JSON.parse(decodeURIComponent(userDataStr));
        
        // Store authentication data
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        }

        // Update auth service state
        this.authService['currentUserSubject'].next(userData);
        this.authService['isAuthenticatedSubject'].next(true);

        this.isProcessing = false;
        this.statusMessage = 'Đăng nhập thành công! Đang chuyển hướng...';

        // Wait a moment then redirect to dashboard
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);

      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        this.handleError('invalid_data');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      this.handleError('processing_error');
    }
  }

  private handleError(errorType: string): void {
    this.isProcessing = false;
    this.hasError = true;

    // Check for custom error message in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const customMessage = urlParams.get('message');

    switch (errorType) {
      case 'oauth_failed':
        this.statusMessage = 'Đăng nhập với Google thất bại. Vui lòng thử lại.';
        break;
      case 'github_oauth_failed':
        this.statusMessage = customMessage || 'Đăng nhập với GitHub thất bại. Vui lòng đảm bảo tài khoản GitHub có email đã xác thực và cho phép truy cập email.';
        break;
      case 'missing_data':
        this.statusMessage = 'Thiếu thông tin xác thực. Vui lòng thử đăng nhập lại.';
        break;
      case 'invalid_data':
        this.statusMessage = 'Dữ liệu xác thực không hợp lệ. Vui lòng thử lại.';
        break;
      case 'processing_error':
      default:
        this.statusMessage = customMessage || 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.';
        break;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
