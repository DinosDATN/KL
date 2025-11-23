import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { AdminService, AdminUser } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.css']
})
export class SendNotificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  notificationForm: FormGroup;
  isLoading = false;
  isSearchingUsers = false;
  users: AdminUser[] = [];
  selectedUsers: number[] = [];
  notificationType: 'specific' | 'broadcast' = 'specific';
  
  typeOptions = [
    { value: 'system', label: 'System' },
    { value: 'friend_request', label: 'Friend Request' },
    { value: 'friend_accepted', label: 'Friend Accepted' },
    { value: 'friend_declined', label: 'Friend Declined' },
    { value: 'room_invite', label: 'Room Invite' },
    { value: 'room_created', label: 'Room Created' },
    { value: 'message', label: 'Message' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'contest', label: 'Contest' }
  ];
  
  roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'user', label: 'User' },
    { value: 'creator', label: 'Creator' },
    { value: 'admin', label: 'Admin' }
  ];
  
  subscriptionOptions = [
    { value: '', label: 'All Subscriptions' },
    { value: 'free', label: 'Free' },
    { value: 'premium', label: 'Premium' }
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.notificationForm = this.fb.group({
      type: ['system', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      message: ['', [Validators.required]],
      data: [''],
      // Specific user fields
      user_ids: [[]],
      user_search: [''],
      // Broadcast filter fields
      broadcast_role: [''],
      broadcast_is_active: [true],
      broadcast_subscription_status: ['']
    });
  }

  ngOnInit() {
    // Watch for notification type changes
    this.notificationForm.get('user_search')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(searchTerm => {
        if (searchTerm && searchTerm.length >= 2) {
          this.searchUsers(searchTerm);
        } else {
          this.users = [];
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setNotificationType(type: 'specific' | 'broadcast') {
    this.notificationType = type;
    if (type === 'broadcast') {
      this.notificationForm.patchValue({
        user_ids: [],
        user_search: ''
      });
      this.selectedUsers = [];
      this.users = [];
    }
  }

  searchUsers(searchTerm: string) {
    if (!searchTerm || searchTerm.length < 2) {
      return;
    }

    this.isSearchingUsers = true;
    this.adminService.getUsers({
      search: searchTerm,
      limit: 10,
      page: 1
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.users || [];
          this.isSearchingUsers = false;
        },
        error: (error) => {
          console.error('Error searching users:', error);
          this.isSearchingUsers = false;
        }
      });
  }

  toggleUserSelection(userId: number) {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
    this.notificationForm.patchValue({
      user_ids: this.selectedUsers
    });
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId);
  }

  removeUser(userId: number) {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
      this.notificationForm.patchValue({
        user_ids: this.selectedUsers
      });
    }
  }

  getSelectedUserNames(): string {
    if (this.selectedUsers.length === 0) {
      return 'No users selected';
    }
    return `${this.selectedUsers.length} user(s) selected`;
  }

  onSubmit() {
    if (this.notificationForm.invalid) {
      this.notificationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.notificationForm.value;

    let notificationData: any = {
      type: formValue.type,
      title: formValue.title,
      message: formValue.message
    };

    // Parse data field if provided
    if (formValue.data && formValue.data.trim()) {
      try {
        notificationData.data = JSON.parse(formValue.data);
      } catch (e) {
        notificationData.data = formValue.data;
      }
    }

    let request$: Observable<{ count: number; [key: string]: any }>;
    
    if (this.notificationType === 'specific') {
      if (this.selectedUsers.length === 0) {
        this.notificationService.error('Error', 'Please select at least one user');
        this.isLoading = false;
        return;
      }
      notificationData.user_ids = this.selectedUsers;
      request$ = this.adminService.sendNotification(notificationData);
    } else {
      // Broadcast notification
      if (formValue.broadcast_role || formValue.broadcast_subscription_status) {
        notificationData.user_filter = {};
        if (formValue.broadcast_role) {
          notificationData.user_filter.role = formValue.broadcast_role;
        }
        if (formValue.broadcast_subscription_status) {
          notificationData.user_filter.subscription_status = formValue.broadcast_subscription_status;
        }
        notificationData.user_filter.is_active = formValue.broadcast_is_active;
      }
      request$ = this.adminService.sendBroadcastNotification(notificationData);
    }

    request$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { count: number; [key: string]: any }) => {
          this.notificationService.success(
            'Success',
            this.notificationType === 'specific'
              ? `Notification sent to ${response.count} user(s)`
              : `Broadcast notification sent to ${response.count} user(s)`
          );
          this.router.navigate(['/admin/notifications']);
        },
        error: (error: any) => {
          console.error('Error sending notification:', error);
          this.notificationService.error(
            'Error',
            error.message || 'Failed to send notification'
          );
          this.isLoading = false;
        }
      });
  }

  onCancel() {
    this.router.navigate(['/admin/notifications']);
  }
}
