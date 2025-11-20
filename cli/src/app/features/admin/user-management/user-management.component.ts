import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService, AdminUser, UserFilters, PaginationInfo } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';

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
  
  // Modal states
  showCreateModal = false;
  showDeleteModal = false;
  showDetailsModal = false;
  showBulkUpdateModal = false;
  selectedUserForDelete: AdminUser | null = null;
  selectedUserForDetails: AdminUser | null = null;
  deletionInfo: any = null;
  isDeleting = false;
  isLoadingDeletionInfo = false;
  
  // Forms
  createUserForm: FormGroup;
  bulkUpdateForm: FormGroup;
  
  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private notificationService: NotificationService
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

    this.createUserForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required],
      is_active: [true],
      subscription_status: ['free']
    });

    this.bulkUpdateForm = this.fb.group({
      role: [''],
      is_active: [''],
      subscription_status: ['']
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

  // TrackBy function for better performance
  trackByUserId(index: number, user: AdminUser): number {
    return user.id;
  }
  
  updateUserRole(userId: number, newRole: string) {
    this.adminService.updateUserRole(userId, newRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          // Update the user in the list - merge to preserve all fields
          const index = this.users.findIndex(u => u.id === userId);
          if (index > -1) {
            // Merge updated fields with existing user data to preserve all properties
            this.users[index] = {
              ...this.users[index],
              ...updatedUser,
              role: updatedUser.role
            };
          }
          this.notificationService.success('Thành công', `Đã cập nhật vai trò của user thành ${newRole}`);
        },
        error: (error) => {
          console.error('Error updating user role:', error);
          this.notificationService.error('Lỗi', error.message || 'Không thể cập nhật vai trò user');
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
          // Update the user in the list - merge to preserve all fields
          const index = this.users.findIndex(u => u.id === userId);
          if (index > -1) {
            // Merge updated fields with existing user data to preserve all properties
            this.users[index] = {
              ...this.users[index],
              ...updatedUser,
              is_active: updatedUser.is_active
            };
          }
          this.notificationService.success('Thành công', `Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} user`);
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.notificationService.error('Lỗi', error.message || 'Không thể cập nhật trạng thái user');
        }
      });
  }

  deleteUser(userId: number, force: boolean = false) {
    // Determine if force is needed based on deletion info
    if (this.deletionInfo && !this.deletionInfo.canDelete && !force) {
      // User has created content, need to confirm force delete
      if (confirm('User này đã tạo nội dung. Bạn có chắc chắn muốn xóa bắt buộc? Tất cả dữ liệu liên quan sẽ bị xóa.')) {
        force = true;
      } else {
        return; // User cancelled
      }
    }

    this.isDeleting = true;
    
    this.adminService.deleteUser(userId, force)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.users = this.users.filter(u => u.id !== userId);
          this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
          this.showBulkActions = this.selectedUsers.length > 0;
          this.showDeleteModal = false;
          this.selectedUserForDelete = null;
          this.deletionInfo = null;
          this.isDeleting = false;
          this.notificationService.success('Thành công', 'Đã xóa user thành công');
          // Reload to update pagination
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.isDeleting = false;
          
          // Check if force is required
          if (error.requiresForce) {
            this.notificationService.error(
              'Không thể xóa', 
              error.message || 'User có dữ liệu liên quan. Vui lòng sử dụng xóa bắt buộc.'
            );
          } else {
            this.notificationService.error('Lỗi', error.message || 'Không thể xóa user');
          }
        }
      });
  }

  confirmDeleteUser(user: AdminUser) {
    this.selectedUserForDelete = user;
    this.showDeleteModal = true;
    this.deletionInfo = null;
    this.isLoadingDeletionInfo = true;
    
    // Load deletion info
    this.adminService.getUserDeletionInfo(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.deletionInfo = info;
          this.isLoadingDeletionInfo = false;
        },
        error: (error) => {
          console.error('Error loading deletion info:', error);
          this.isLoadingDeletionInfo = false;
          // Still show modal but without detailed info
        }
      });
  }

  createUser() {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    const userData = this.createUserForm.value;
    this.adminService.createUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newUser) => {
          this.notificationService.success('Thành công', 'Đã tạo user mới thành công');
          this.showCreateModal = false;
          this.createUserForm.reset({
            role: 'user',
            is_active: true,
            subscription_status: 'free'
          });
          // Reload users
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.notificationService.error('Lỗi', error.message || 'Không thể tạo user');
        }
      });
  }

  viewUserDetails(user: AdminUser) {
    this.selectedUserForDetails = user;
    this.showDetailsModal = true;
  }

  bulkUpdateUsers() {
    if (this.selectedUsers.length === 0) {
      this.notificationService.error('Lỗi', 'Vui lòng chọn ít nhất một user');
      return;
    }

    const updateData: any = {};
    const formValue = this.bulkUpdateForm.value;
    
    if (formValue.role) updateData.role = formValue.role;
    if (formValue.is_active !== '') updateData.is_active = formValue.is_active === 'true';
    if (formValue.subscription_status) updateData.subscription_status = formValue.subscription_status;

    if (Object.keys(updateData).length === 0) {
      this.notificationService.error('Lỗi', 'Vui lòng chọn ít nhất một trường để cập nhật');
      return;
    }

    this.adminService.bulkUpdateUsers(this.selectedUsers, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.notificationService.success('Thành công', `Đã cập nhật ${result.updatedCount} user(s)`);
          this.showBulkUpdateModal = false;
          this.selectedUsers = [];
          this.showBulkActions = false;
          this.bulkUpdateForm.reset();
          // Reload users
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error bulk updating users:', error);
          this.notificationService.error('Lỗi', error.message || 'Không thể cập nhật users');
        }
      });
  }

  bulkDeleteUsers() {
    if (this.selectedUsers.length === 0) {
      this.notificationService.error('Lỗi', 'Vui lòng chọn ít nhất một user');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${this.selectedUsers.length} user(s) đã chọn?`)) {
      return;
    }

    // Delete users one by one (API doesn't have bulk delete)
    const deletePromises = this.selectedUsers.map(userId => 
      this.adminService.deleteUser(userId).toPromise()
    );

    Promise.all(deletePromises)
      .then(() => {
        this.notificationService.success('Thành công', `Đã xóa ${this.selectedUsers.length} user(s)`);
        this.selectedUsers = [];
        this.showBulkActions = false;
        this.loadUsers();
      })
      .catch((error) => {
        console.error('Error bulk deleting users:', error);
        this.notificationService.error('Lỗi', 'Có lỗi xảy ra khi xóa users');
        this.loadUsers();
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
    this.adminService.exportUsers('csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.notificationService.success('Thành công', 'Đã xuất danh sách users thành công');
        },
        error: (error) => {
          console.error('Error exporting users:', error);
          this.notificationService.error('Lỗi', error.message || 'Không thể xuất danh sách users');
        }
      });
  }
}