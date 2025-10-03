import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Notification Toast Container -->
    <!-- Đổi vị trí sang góc dưới bên phải -->
    <div 
      class="fixed bottom-4 right-4 z-50 space-y-3 p-2 w-[400px] max-w-full"
      @notificationList>
      <div
        *ngFor="let notification of notifications; trackBy: trackByNotification"
        class="max-w-sm w-full bg-white dark:bg-gray-900 shadow-xl rounded-xl ring-1 ring-black ring-opacity-5 pointer-events-auto overflow-hidden cursor-pointer"
        [class]="getNotificationClasses(notification.type)"
      >
        <div class="p-4 flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0" [class]="getTextColorClasses(notification.type)">
            <!-- Success Icon (Checkmark in circle) -->
            <svg
              *ngIf="notification.type === 'success'"
              class="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.23a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
            </svg>
            
            <!-- Error Icon (X in circle) -->
            <svg
              *ngIf="notification.type === 'error'"
              class="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-2.78 2.78a.75.75 0 101.06 1.06L12 13.06l2.78 2.78a.75.75 0 001.06-1.06L13.06 12l2.78-2.78a.75.75 0 00-1.06-1.06L12 10.94l-2.78-2.78z" clip-rule="evenodd" />
            </svg>
            
            <!-- Warning Icon (Triangle) -->
            <svg
              *ngIf="notification.type === 'warning'"
              class="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path fill-rule="evenodd" d="M9.401 3.003c1.155-2.013 4.043-2.013 5.198 0l7.355 12.786c1.154 2.013-.342 4.586-2.599 4.586H4.645c-2.257 0-3.753-2.573-2.598-4.586L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
            </svg>

            <!-- Info Icon (i in circle) -->
            <svg
              *ngIf="notification.type === 'info'"
              class="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.25-3.03a.75.75 0 00-1.299-.54l-3.75 6.25a.75.75 0 101.299.54l3.75-6.25a.75.75 0 000-.01z" clip-rule="evenodd" />
            </svg>
          </div>
          
          <!-- Content -->
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-semibold leading-5 text-gray-900 dark:text-white">
              {{ notification.title }}
            </p>
            <p
              *ngIf="notification.message"
              class="mt-1 text-sm text-gray-600 dark:text-gray-400"
            >
              {{ notification.message }}
            </p>
          </div>
          
          <!-- Close Button -->
          <div class="ml-4 flex-shrink-0 flex">
            <button
              (click)="removeNotification(notification.id)"
              class="p-1 rounded-md inline-flex hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
              [class]="getCloseButtonClasses(notification.type)"
            >
              <span class="sr-only">Close</span>
              <!-- Close SVG -->
              <svg
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Progress bar for auto-hide -->
        <div
          *ngIf="notification.duration && notification.duration > 0"
          class="h-1 bg-gray-200 dark:bg-gray-800 overflow-hidden"
        >
          <div
            class="h-full transition-all ease-linear"
            [class]="getProgressBarClasses(notification.type)"
            [style.animation]="'progress-bar ' + (notification.duration || 5000) + 'ms linear forwards'"
          ></div>
        </div>
      </div>
    </div>
  `,
  // Cần import BrowserAnimationsModule ở module gốc để @animations hoạt động
  animations: [
    trigger('notificationList', [
      transition('* => *', [ // Transition cho mọi sự thay đổi trong danh sách
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(100%)' }),
          stagger(50, [
            animate('300ms cubic-bezier(.35, 0, .25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          style({ opacity: 1, transform: 'translateX(0)' }),
          animate('200ms ease-out', style({ opacity: 0, transform: 'translateX(100%)' }))
        ], { optional: true })
      ])
    ])
  ],
  styles: [`
    @keyframes progress-bar {
      /* Animation này sẽ làm thanh tiến trình chạy từ 100% về 0% */
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeNotification(id: string): void {
    this.notificationService.remove(id);
  }

  /**
   * Trả về các class cho viền (border-l-4) của container chính.
   * Màu sắc của icon và nút đóng đã được tách ra để dễ quản lý.
   */
  getNotificationClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500';
      case 'error':
        return 'border-l-4 border-red-500';
      case 'warning':
        return 'border-l-4 border-yellow-500';
      case 'info':
      default:
        return 'border-l-4 border-blue-500';
    }
  }

  /**
   * Trả về class màu cho Icon và Nút Đóng để tạo điểm nhấn
   */
  getTextColorClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  }

  /**
   * Trả về class màu cho Nút Đóng
   */
  getCloseButtonClasses(type: string): string {
    const baseClasses = 'bg-white dark:bg-gray-900 focus:ring-offset-2';
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-400 hover:text-green-500 focus:ring-green-500`;
      case 'error':
        return `${baseClasses} text-red-400 hover:text-red-500 focus:ring-red-500`;
      case 'warning':
        return `${baseClasses} text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500`;
      case 'info':
      default:
        return `${baseClasses} text-blue-400 hover:text-blue-500 focus:ring-blue-500`;
    }
  }


  /**
   * Trả về class màu cho thanh tiến trình (Progress Bar)
   */
  getProgressBarClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  }

  trackByNotification(index: number, notification: Notification): string {
    return notification.id;
  }
}
