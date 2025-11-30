import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, ConfirmationNotification } from '../../../core/services/notification.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-confirmation-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Confirmation Toast Container -->
    <div 
      class="fixed top-4 right-4 z-[60] space-y-3 p-2 w-[400px] max-w-full"
      @confirmationList>
      <div
        *ngFor="let confirmation of confirmations; trackBy: trackByConfirmation"
        class="max-w-sm w-full bg-white dark:bg-gray-900 shadow-xl rounded-xl ring-1 ring-black ring-opacity-5 pointer-events-auto overflow-hidden"
        [class]="getConfirmationClasses(confirmation.type)"
      >
        <div class="p-4">
          <!-- Icon and Title -->
          <div class="flex items-start">
            <div class="flex-shrink-0" [class]="getIconColorClasses(confirmation.type)">
              <!-- Warning Icon (Triangle) -->
              <svg
                *ngIf="confirmation.type === 'warning'"
                class="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path fill-rule="evenodd" d="M9.401 3.003c1.155-2.013 4.043-2.013 5.198 0l7.355 12.786c1.154 2.013-.342 4.586-2.599 4.586H4.645c-2.257 0-3.753-2.573-2.598-4.586L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
              </svg>
              
              <!-- Info Icon (i in circle) -->
              <svg
                *ngIf="confirmation.type === 'info'"
                class="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.25-3.03a.75.75 0 00-1.299-.54l-3.75 6.25a.75.75 0 101.299.54l3.75-6.25a.75.75 0 000-.01z" clip-rule="evenodd" />
              </svg>

              <!-- Error Icon (X in circle) -->
              <svg
                *ngIf="confirmation.type === 'error'"
                class="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-2.78 2.78a.75.75 0 101.06 1.06L12 13.06l2.78 2.78a.75.75 0 001.06-1.06L13.06 12l2.78-2.78a.75.75 0 00-1.06-1.06L12 10.94l-2.78-2.78z" clip-rule="evenodd" />
              </svg>
            </div>
            
            <!-- Content -->
            <div class="ml-3 flex-1 pt-0.5">
              <p class="text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                {{ confirmation.title }}
              </p>
              <p
                *ngIf="confirmation.message"
                class="mt-1 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ confirmation.message }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 flex gap-2 justify-end">
            <button
              (click)="onCancel(confirmation.id)"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              (click)="onConfirm(confirmation.id)"
              class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              [class]="getConfirmButtonClasses(confirmation.type)"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('confirmationList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-100%)' }),
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
  ]
})
export class ConfirmationToastComponent implements OnInit, OnDestroy {
  confirmations: ConfirmationNotification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.notificationService.confirmations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmations => {
        this.confirmations = confirmations;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onConfirm(id: string): void {
    const confirmation = this.confirmations.find(c => c.id === id);
    if (confirmation && confirmation.onConfirm) {
      confirmation.onConfirm();
    }
    this.notificationService.removeConfirmation(id);
  }

  onCancel(id: string): void {
    const confirmation = this.confirmations.find(c => c.id === id);
    if (confirmation && confirmation.onCancel) {
      confirmation.onCancel();
    }
    this.notificationService.removeConfirmation(id);
  }

  getConfirmationClasses(type: string): string {
    switch (type) {
      case 'warning':
        return 'border-l-4 border-yellow-500';
      case 'error':
        return 'border-l-4 border-red-500';
      case 'info':
      default:
        return 'border-l-4 border-blue-500';
    }
  }

  getIconColorClasses(type: string): string {
    switch (type) {
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'info':
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  }

  getConfirmButtonClasses(type: string): string {
    switch (type) {
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  }

  trackByConfirmation(index: number, confirmation: ConfirmationNotification): string {
    return confirmation.id;
  }
}

