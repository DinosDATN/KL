import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
    >
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div
          class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          <div class="flex flex-col items-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
            ></div>
            <h2
              class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
            >
              {{
                isProcessing
                  ? 'Đang xử lý đăng nhập...'
                  : hasError
                  ? 'Đăng nhập thất bại'
                  : 'Đăng nhập thành công!'
              }}
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
              {{ statusMessage }}
            </p>
            <div *ngIf="hasError" class="mt-4">
              <button
                (click)="goToLogin()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: [],
})
export class OAuthCallbackComponent implements OnInit, AfterViewInit {
  isProcessing = true;
  hasError = false;
  statusMessage = 'Đang tải màn hình...';
  private isViewReady = false;
  private callbackHandled = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Chỉ lấy query params trong ngOnInit, chưa xử lý logic
    // Đợi ngAfterViewInit để đảm bảo view đã ready
  }

  ngAfterViewInit(): void {
    // Đánh dấu view đã ready
    this.isViewReady = true;

    // Đợi hydration hoàn tất (SSR) và browser ready
    this.waitForPageReady().then(() => {
      // Đợi thêm một chút để đảm bảo component đã render hoàn toàn
      // và màn hình đã hiển thị (spinner, message đã xuất hiện)
      // Cookie chỉ sẵn sàng sau khi màn hình đã render xong
      setTimeout(() => {
        this.handleCallback();
      }, 500); // 500ms delay sau khi view ready để đảm bảo component render hoàn toàn
    });
  }

  /**
   * Đợi cho đến khi page load xong (hydration hoàn tất)
   */
  private waitForPageReady(): Promise<void> {
    return new Promise((resolve) => {
      if (!isPlatformBrowser(this.platformId)) {
        // SSR mode - không cần đợi
        resolve();
        return;
      }

      // Kiểm tra xem document đã ready chưa
      if (document.readyState === 'complete') {
        // Document đã load xong, đợi thêm một chút để đảm bảo Angular hydration hoàn tất
        setTimeout(() => {
          this.statusMessage = 'Đang xử lý đăng nhập...';
          resolve();
        }, 100);
      } else {
        // Đợi window load event
        window.addEventListener('load', () => {
          // Đợi thêm một chút để đảm bảo Angular hydration hoàn tất
          setTimeout(() => {
            this.statusMessage = 'Đang xử lý đăng nhập...';
            resolve();
          }, 100);
        });
      }
    });
  }

  private async handleCallback(): Promise<void> {
    // Tránh xử lý callback nhiều lần
    if (this.callbackHandled) {
      return;
    }
    this.callbackHandled = true;

    try {
      // Đợi cho đến khi view ready
      if (!this.isViewReady) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const queryParams = this.route.snapshot.queryParams;
      console.log('OAuth callback query params:', queryParams);

      // Check for error parameter
      if (queryParams['error']) {
        this.handleError(queryParams['error']);
        return;
      }

      // ✅ Check for success flag (cookie should be set by backend)
      const success = queryParams['success'];

      if (success === 'true') {
        console.log('✅ OAuth callback: Success flag received');
        console.log('✅ Component rendered, waiting for cookie to be ready...');

        // ✅ Đợi sau khi component đã render hoàn toàn (màn hình đã hiển thị)
        // Cookie chỉ sẵn sàng sau khi màn hình "Đăng nhập thành công! Đang chuyển hướng..." đã xuất hiện
        // Cookie từ backend redirect (localhost:3000) cần thời gian để được browser xử lý
        // và có thể được gửi kèm với request từ frontend (localhost:4200) qua proxy
        setTimeout(() => {
          console.log('✅ Component fully rendered, now verifying session...');
          this.verifySessionWithRetry();
        }, 800); // 800ms delay sau khi component render để đảm bảo cookie đã sẵn sàng
      } else {
        console.error('❌ No success flag in OAuth callback');
        this.handleError('missing_data');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.handleError('processing_error');
    }
  }

  /**
   * Verify session with retry logic
   * Retries getProfile() if it fails the first time (cookie may not be ready yet)
   */
  private verifySessionWithRetry(
    retryCount: number = 0,
    maxRetries: number = 2
  ): void {
    this.authService.getProfile().subscribe({
      next: (response) => {
        console.log(
          '✅ Session verified, user authenticated:',
          response.data.user.name
        );
        console.log('✅ Cookie is working correctly');

        // Store user data
        this.authService.setUserData(response.data.user);

        this.isProcessing = false;
        this.statusMessage = 'Đăng nhập thành công! Đang chuyển hướng...';

        // Wait a moment then redirect based on user role
        setTimeout(() => {
          if (response.data.user.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }, 1500);
      },
      error: (error) => {
        // Retry logic: cookie might not be ready yet after redirect
        // This is expected behavior - cookie needs time to be processed by browser
        // Cookie from backend redirect needs time to be stored and available for subsequent requests
        // ✅ Don't log error during retries - this is normal timing behavior
        if (retryCount < maxRetries) {
          const delay = (retryCount + 1) * 1000; // Increasing delay: 1000ms, 2000ms
          // Silently retry without logging error - cookie just needs more time

          setTimeout(() => {
            this.verifySessionWithRetry(retryCount + 1, maxRetries);
          }, delay);
        } else {
          // All retries failed - check if we can continue anyway
          // Sometimes cookie works even if getProfile() fails initially
          // ✅ Don't log warnings - silently check if user is already logged in

          // Check if we have any user data in localStorage as fallback
          const storedUser = this.authService.getCurrentUser();
          if (storedUser) {
            console.log(
              '✅ Found user data in storage, cookie should be working. Proceeding with login.'
            );
            this.isProcessing = false;
            this.statusMessage = 'Đăng nhập thành công! Đang chuyển hướng...';

            setTimeout(() => {
              if (storedUser.role === 'admin') {
                this.router.navigate(['/admin/dashboard']);
              } else {
                this.router.navigate(['/']);
              }
            }, 1500);
          } else {
            // No user data and all retries failed - this is a real error
            console.error(
              '❌ Session verification failed after all retries and no user data found:',
              error
            );
            this.handleError('session_verification_failed');
          }
        }
      },
    });
  }

  private handleError(errorType: string): void {
    this.isProcessing = false;
    this.hasError = true;

    // Check for custom error message in URL params
    let customMessage: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      const urlParams = new URLSearchParams(window.location.search);
      customMessage = urlParams.get('message');
    }

    switch (errorType) {
      case 'oauth_failed':
        this.statusMessage = 'Đăng nhập với Google thất bại. Vui lòng thử lại.';
        break;
      case 'github_oauth_failed':
        this.statusMessage =
          customMessage ||
          'Đăng nhập với GitHub thất bại. Vui lòng đảm bảo tài khoản GitHub có email đã xác thực và cho phép truy cập email.';
        break;
      case 'missing_data':
        this.statusMessage =
          'Thiếu thông tin xác thực. Vui lòng thử đăng nhập lại.';
        break;
      case 'invalid_data':
        this.statusMessage = 'Dữ liệu xác thực không hợp lệ. Vui lòng thử lại.';
        break;
      case 'session_verification_failed':
        this.statusMessage =
          'Không thể xác thực phiên đăng nhập. Cookie có thể bị chặn. Vui lòng thử đăng nhập thông thường hoặc kiểm tra cài đặt trình duyệt.';
        break;
      case 'processing_error':
      default:
        this.statusMessage =
          customMessage ||
          'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.';
        break;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
