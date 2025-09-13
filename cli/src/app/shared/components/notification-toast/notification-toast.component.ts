import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Notification Toast Container -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let notification of notifications; trackBy: trackByNotification"
        class="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out"
        [class]="getNotificationClasses(notification.type)"
      >
        <div class="p-4">
          <div class="flex items-start">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <!-- Success Icon -->
              <svg
                *ngIf="notification.type === 'success'"
                class="h-6 w-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              
              <!-- Error Icon -->
              <svg
                *ngIf="notification.type === 'error'"
                class="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              
              <!-- Warning Icon -->
              <svg
                *ngIf="notification.type === 'warning'"
                class="h-6 w-6 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              
              <!-- Info Icon -->
              <svg
                *ngIf="notification.type === 'info'"
                class="h-6 w-6 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            
            <!-- Content -->
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ notification.title }}
              </p>
              <p
                *ngIf="notification.message"
                class="mt-1 text-sm text-gray-500 dark:text-gray-300"
              >
                {{ notification.message }}
              </p>
            </div>
            
            <!-- Close Button -->
            <div class="ml-4 flex-shrink-0 flex">
              <button
                (click)="removeNotification(notification.id)"
                class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="sr-only">Close</span>
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
        </div>
        
        <!-- Progress bar for auto-hide -->
        <div
          *ngIf="notification.duration && notification.duration > 0"
          class="h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden"
        >
          <div
            class="h-full transition-all ease-linear"
            [class]="getProgressBarClasses(notification.type)"
            [style.animation]="'progress-bar ' + (notification.duration || 5000) + 'ms linear'"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes progress-bar {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

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

  getNotificationClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-400';
      case 'error':
        return 'border-l-4 border-red-400';
      case 'warning':
        return 'border-l-4 border-yellow-400';
      case 'info':
        return 'border-l-4 border-blue-400';
      default:
        return 'border-l-4 border-gray-400';
    }
  }

  getProgressBarClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  }

  trackByNotification(index: number, notification: Notification): string {
    return notification.id;
  }
}
