import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminUser, PaginationInfo } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  User?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface NotificationStatistics {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  readRate: number;
  notificationsByType: Array<{ type: string; count: number }>;
  recentNotifications: Notification[];
}

@Component({
  selector: 'app-notification-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './notification-management.component.html',
  styleUrls: ['./notification-management.component.css']
})
export class NotificationManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  notifications: Notification[] = [];
  statistics: NotificationStatistics | null = null;
  totalNotifications = 0;
  isLoading = true;
  isLoadingStats = true;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  pagination: PaginationInfo | null = null;
  
  // Filters
  filterForm: FormGroup;
  typeOptions = [
    { value: '', label: 'All Types' },
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
  
  readStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Read' },
    { value: 'false', label: 'Unread' }
  ];
  
  sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Updated' },
    { value: 'is_read', label: 'Read Status' },
    { value: 'type', label: 'Type' }
  ];
  
  // Selected notifications for bulk operations
  selectedNotifications: number[] = [];
  showBulkActions = false;
  
  // User search for filter
  isSearchingUsers = false;
  userSearchResults: AdminUser[] = [];
  selectedUser: AdminUser | null = null;
  userSearchTerm = '';
  private userSearchSubject = new Subject<string>();
  
  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      is_read: [''],
      user_id: [''],
      start_date: [''],
      end_date: [''],
      sortBy: ['created_at'],
      sortOrder: ['DESC']
    });
  }

  ngOnInit() {
    this.setupFilterSubscription();
    this.setupUserSearch();
    this.loadStatistics();
    this.loadNotifications();
  }
  
  private setupUserSearch() {
    // Debounce user search to avoid too many API calls
    this.userSearchSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        if (!searchTerm || searchTerm.length < 2) {
          this.userSearchResults = [];
          this.isSearchingUsers = false;
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
              this.userSearchResults = response.users || [];
              this.isSearchingUsers = false;
            },
            error: (error) => {
              console.error('Error searching users:', error);
              this.userSearchResults = [];
              this.isSearchingUsers = false;
            }
          });
      });
  }
  
  searchUsers(searchTerm: string) {
    this.userSearchTerm = searchTerm;
    this.userSearchSubject.next(searchTerm);
  }
  
  selectUser(user: AdminUser) {
    this.selectedUser = user;
    this.filterForm.patchValue({ user_id: user.id });
    this.userSearchResults = [];
    this.userSearchTerm = '';
  }
  
  clearUserFilter() {
    this.selectedUser = null;
    this.filterForm.patchValue({ user_id: '' });
    this.userSearchTerm = '';
    this.userSearchResults = [];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterSubscription() {
    // Watch for filter changes and reload data
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page on filter change
        this.loadNotifications();
      });
  }

  loadStatistics() {
    this.isLoadingStats = true;
    const formValue = this.filterForm.value;
    
    this.adminService.getNotificationStatistics({
      start_date: formValue.start_date || undefined,
      end_date: formValue.end_date || undefined
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.statistics = stats;
          this.isLoadingStats = false;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          this.isLoadingStats = false;
        }
      });
  }

  loadNotifications() {
    this.isLoading = true;
    this.error = null;
    
    const formValue = this.filterForm.value;
    const filters: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: formValue.sortBy || 'created_at',
      sortOrder: formValue.sortOrder || 'DESC'
    };
    
    if (formValue.search) filters.search = formValue.search;
    if (formValue.type) filters.type = formValue.type;
    if (formValue.is_read !== '') filters.is_read = formValue.is_read === 'true';
    if (formValue.user_id) filters.user_id = parseInt(formValue.user_id);
    if (formValue.start_date) filters.start_date = formValue.start_date;
    if (formValue.end_date) filters.end_date = formValue.end_date;
    
    this.adminService.getNotifications(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notifications = response.notifications || [];
          
          // Ensure pagination object exists and calculate total_pages if needed
          if (response.pagination) {
            this.pagination = response.pagination;
            // Calculate total_pages if not provided or is 0
            if ((!this.pagination.total_pages || this.pagination.total_pages === 0) && this.pagination.total_items) {
              this.pagination.total_pages = Math.ceil(this.pagination.total_items / this.itemsPerPage) || 1;
            }
            // Ensure total_pages is at least 1 if there are items
            if (this.pagination.total_items > 0 && (!this.pagination.total_pages || this.pagination.total_pages === 0)) {
              this.pagination.total_pages = 1;
            }
          } else {
            // Create default pagination
            const totalItems = response.notifications?.length || 0;
            this.pagination = {
              current_page: this.currentPage,
              total_pages: totalItems > 0 ? Math.ceil(totalItems / this.itemsPerPage) || 1 : 0,
              total_items: totalItems,
              items_per_page: this.itemsPerPage
            };
          }
          
          this.totalNotifications = this.pagination.total_items || 0;
          
          // Debug: log pagination info
          console.log('Notifications pagination:', {
            total_items: this.totalNotifications,
            total_pages: this.pagination.total_pages,
            current_page: this.currentPage,
            items_per_page: this.itemsPerPage
          });
          this.isLoading = false;
          this.selectedNotifications = [];
          this.showBulkActions = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.error = error.message || 'Failed to load notifications';
          this.isLoading = false;
          this.notificationService.error('Error', this.error || 'Failed to load notifications');
        }
      });
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= (this.pagination?.total_pages || 1)) {
      this.currentPage = page;
      this.loadNotifications();
    }
  }

  onItemsPerPageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const itemsPerPage = parseInt(target.value);
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.loadNotifications();
  }
  
  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    const totalPages = this.pagination.total_pages;
    const current = this.currentPage;
    const pages: number[] = [];
    
    // Show max 7 page numbers
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        // Show first 5 pages and last page
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        // Show first page and last 5 pages
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, current-1, current, current+1, last page
        pages.push(1);
        pages.push(-1); // Ellipsis
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  toggleNotificationSelection(notificationId: number) {
    const index = this.selectedNotifications.indexOf(notificationId);
    if (index > -1) {
      this.selectedNotifications.splice(index, 1);
    } else {
      this.selectedNotifications.push(notificationId);
    }
    this.showBulkActions = this.selectedNotifications.length > 0;
  }

  toggleAllSelection() {
    if (this.selectedNotifications.length === this.notifications.length) {
      this.selectedNotifications = [];
    } else {
      this.selectedNotifications = this.notifications.map(n => n.id);
    }
    this.showBulkActions = this.selectedNotifications.length > 0;
  }

  isSelected(notificationId: number): boolean {
    return this.selectedNotifications.includes(notificationId);
  }

  areAllSelected(): boolean {
    return this.notifications.length > 0 && 
           this.selectedNotifications.length === this.notifications.length;
  }

  markAsRead(notificationId: number) {
    this.adminService.updateNotificationStatus(notificationId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Notification marked as read');
          this.loadNotifications();
          this.loadStatistics();
        },
        error: (error) => {
          this.notificationService.error('Error', error.message || 'Failed to update notification');
        }
      });
  }

  markAsUnread(notificationId: number) {
    this.adminService.updateNotificationStatus(notificationId, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Notification marked as unread');
          this.loadNotifications();
          this.loadStatistics();
        },
        error: (error) => {
          this.notificationService.error('Error', error.message || 'Failed to update notification');
        }
      });
  }

  deleteNotification(notificationId: number) {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    this.adminService.deleteNotification(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Notification deleted successfully');
          this.loadNotifications();
          this.loadStatistics();
        },
        error: (error) => {
          this.notificationService.error('Error', error.message || 'Failed to delete notification');
        }
      });
  }

  bulkDeleteNotifications() {
    if (this.selectedNotifications.length === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to delete ${this.selectedNotifications.length} notification(s)?`)) {
      return;
    }

    this.adminService.bulkDeleteNotifications(this.selectedNotifications)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notificationService.success(
            'Success', 
            `${response.deletedCount} notification(s) deleted successfully`
          );
          this.loadNotifications();
          this.loadStatistics();
        },
        error: (error) => {
          this.notificationService.error('Error', error.message || 'Failed to delete notifications');
        }
      });
  }

  bulkMarkAsRead() {
    if (this.selectedNotifications.length === 0) {
      return;
    }

    const promises = this.selectedNotifications.map(id =>
      this.adminService.updateNotificationStatus(id, true).toPromise()
    );

    Promise.all(promises)
      .then(() => {
        this.notificationService.success(
          'Success',
          `${this.selectedNotifications.length} notification(s) marked as read`
        );
        this.loadNotifications();
        this.loadStatistics();
      })
      .catch((error) => {
        this.notificationService.error('Error', error.message || 'Failed to update notifications');
      });
  }

  clearFilters() {
    this.clearUserFilter();
    this.filterForm.reset({
      search: '',
      type: '',
      is_read: '',
      user_id: '',
      start_date: '',
      end_date: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  }

  getTypeLabel(type: string): string {
    const option = this.typeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      system: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      friend_request: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      friend_accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      friend_declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      room_invite: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      room_created: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      message: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      achievement: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      contest: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
