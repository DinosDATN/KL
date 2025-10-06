import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminUser, UserFilters, PaginationInfo } from '../../../core/services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  users: AdminUser[] = [];
  totalUsers = 0;
  isLoading = true;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  pagination: PaginationInfo | null = null;
  
  // Filters
  filterForm: FormGroup;
  roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'user', label: 'User' },
    { value: 'creator', label: 'Creator' },
    { value: 'admin', label: 'Admin' }
  ];
  
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];
  
  subscriptionOptions = [
    { value: '', label: 'All Subscriptions' },
    { value: 'free', label: 'Free' },
    { value: 'premium', label: 'Premium' }
  ];
  
  sortOptions = [
    { value: 'created_at', label: 'Registration Date' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'last_seen_at', label: 'Last Activity' }
  ];

  // Selected users for bulk operations
  selectedUsers: number[] = [];
  showBulkActions = false;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      role: [''],
      is_active: [''],
      subscription_status: [''],
      sortBy: ['created_at'],
      registration_date: [''],
      last_activity: ['']
    });
  }

  ngOnInit() {
    this.setupFilterSubscription();
    this.loadUsers();
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
        this.loadUsers();
      });
  }

  loadUsers() {
    this.isLoading = true;
    this.error = null;
    
    const filters: UserFilters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...this.filterForm.value
    };
    
    // Remove empty filter values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof UserFilters] === '') {
        delete filters[key as keyof UserFilters];
      }
    });

    this.adminService.getUsers(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.users = data.users;
          this.pagination = data.pagination;
          this.totalUsers = data.pagination.total_items;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.error = error.message || 'Failed to load users';
          this.isLoading = false;
        }
      });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters() {
    this.filterForm.reset();
    this.currentPage = 1;
    // loadUsers will be called automatically via form subscription
  }

  toggleUserSelection(userId: number) {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
    this.showBulkActions = this.selectedUsers.length > 0;
  }

  toggleAllUsers() {
    if (this.selectedUsers.length === this.users.length) {
      this.selectedUsers = [];
    } else {
      this.selectedUsers = this.users.map(user => user.id);
    }
    this.showBulkActions = this.selectedUsers.length > 0;
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId);
  }

  updateUserRole(userId: number, newRole: string) {
    this.adminService.updateUserRole(userId, newRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          // Update the user in the list
          const index = this.users.findIndex(u => u.id === userId);
          if (index > -1) {
            this.users[index] = updatedUser;
          }
        },
        error: (error) => {
          console.error('Error updating user role:', error);
          // You might want to show a notification here
        }
      });
  }

  toggleUserStatus(userId: number) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = !user.is_active;
    
    this.adminService.toggleUserStatus(userId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          // Update the user in the list
          const index = this.users.findIndex(u => u.id === userId);
          if (index > -1) {
            this.users[index] = updatedUser;
          }
        },
        error: (error) => {
          console.error('Error updating user status:', error);
        }
      });
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'creator': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  }

  getStatusColor(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }

  getSubscriptionColor(status: string): string {
    return status === 'premium'
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatLastSeen(dateString?: string): string {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  exportUsers() {
    this.adminService.exportUsers('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting users:', error);
      }
    });
  }
}