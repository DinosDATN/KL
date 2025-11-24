import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ThemeService } from '../../core/services/theme.service';
import {
  ProfileService,
  ProfileData,
  UpdateProfileRequest,
  UpdateProfileDetailsRequest,
  UpdateSettingsRequest,
  ChangePasswordRequest,
} from '../../core/services/profile.service';
import {
  CreatorProfileService,
  CreatorStatistics,
  CreatorProfileData,
} from '../../core/services/creator-profile.service';
import { AuthService } from '../../core/services/auth.service';
import {
  User,
  UserProfile,
  UserStat,
} from '../../core/models/user.model';
import { Course } from '../../core/models/course.model';
import { Contest } from '../../core/models/contest.model';
import { ContestService } from '../../core/services/contest.service';

@Component({
  selector: 'app-creator-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './creator-profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class CreatorProfileComponent implements OnInit, OnDestroy {
  @ViewChild('avatarFileInput') avatarFileInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  // Data properties
  user: User | null = null;
  userProfile: UserProfile | null = null;
  userStat: UserStat | null = null;
  creatorStatistics: CreatorStatistics | null = null;
  courses: Course[] = [];
  contests: Contest[] = [];
  contestStats = {
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    totalParticipants: 0,
  };

  // UI state
  activeTab: 'overview' | 'courses' | 'analytics' | 'settings' = 'overview';
  editMode: 'none' | 'basic' | 'details' | 'settings' | 'password' = 'none';
  isLoading = false;
  isUploading = false;
  errorMessage = '';
  successMessage = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  coursesPerPage = 10;

  // Forms
  basicProfileForm: FormGroup;
  detailsForm: FormGroup;
  settingsForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    public themeService: ThemeService,
    private profileService: ProfileService,
    private creatorProfileService: CreatorProfileService,
    private authService: AuthService,
    private contestService: ContestService,
    private fb: FormBuilder
  ) {
    this.basicProfileForm = this.createBasicProfileForm();
    this.detailsForm = this.createDetailsForm();
    this.settingsForm = this.createSettingsForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    // Wait for auth to initialize before loading profile
    this.authService.authInitialized$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (initialized) => {
        if (initialized) {
          // Only load profile if user is authenticated and is a creator
          if (this.authService.isAuthenticated()) {
            const currentUser = this.authService.getCurrentUser();
            if (currentUser && (currentUser.role === 'creator' || currentUser.role === 'admin')) {
              this.loadProfile();
            } else {
              this.errorMessage = 'Bạn cần là Creator để truy cập trang này';
            }
          } else {
            this.errorMessage = 'Vui lòng đăng nhập để xem profile';
          }
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form creation methods
  private createBasicProfileForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  private createDetailsForm(): FormGroup {
    return this.fb.group({
      bio: ['', [Validators.maxLength(500)]],
      birthday: [''],
      gender: [''],
      phone: ['', [Validators.pattern(/^[+]?[1-9]\d{1,14}$/)]],
      address: ['', [Validators.maxLength(200)]],
      website_url: [''],
      github_url: [''],
      linkedin_url: [''],
    });
  }

  private createSettingsForm(): FormGroup {
    return this.fb.group({
      preferred_language: ['vi'],
      theme_mode: ['system'],
      layout: ['expanded'],
      notifications: [true],
      visibility_profile: [true],
      visibility_achievements: [true],
      visibility_progress: [true],
      visibility_activity: [true],
    });
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group(
      {
        current_password: ['', [Validators.required]],
        new_password: ['', [Validators.required, Validators.minLength(6)]],
        confirm_password: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('new_password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  // Data loading methods
  loadProfile(): void {
    this.isLoading = true;
    this.clearMessages();

    this.profileService
      .getProfile()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (profileData: ProfileData) => {
          this.user = profileData.user;
          this.userProfile = profileData.profile;
          this.userStat = profileData.stats;

          this.updateForms();
          this.loadCreatorStatistics();
          this.loadCreatorCourses();
          this.loadCreatorContests();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Không thể tải profile';
          console.error('Error loading profile:', error);
        },
      });
  }

  loadCreatorStatistics(): void {
    this.creatorProfileService
      .getCreatorStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.creatorStatistics = stats;
        },
        error: (error) => {
          console.error('Error loading creator statistics:', error);
        },
      });
  }

  loadCreatorCourses(page: number = 1): void {
    this.creatorProfileService
      .getCreatorCourses(page, this.coursesPerPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.courses = response.courses;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.total_pages;
        },
        error: (error) => {
          console.error('Error loading creator courses:', error);
        },
      });
  }

  loadCreatorContests(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.contestService
      .getAllContests(1, 100, { created_by: currentUser.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.contests = response.data;
            this.calculateContestStats();
          }
        },
        error: (error) => {
          console.error('Error loading creator contests:', error);
        },
      });
  }

  calculateContestStats(): void {
    this.contestStats = {
      total: this.contests.length,
      active: this.contests.filter((c) => c.status === 'active').length,
      upcoming: this.contests.filter((c) => c.status === 'upcoming').length,
      completed: this.contests.filter((c) => c.status === 'completed').length,
      totalParticipants: this.contests.reduce(
        (sum, c) => sum + (c.participant_count || 0),
        0
      ),
    };
  }

  private updateForms(): void {
    if (this.user) {
      this.basicProfileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
      });
    }

    if (this.userProfile) {
      this.detailsForm.patchValue({
        bio: this.userProfile.bio,
        birthday: this.userProfile.birthday,
        gender: this.userProfile.gender,
        phone: this.userProfile.phone,
        address: this.userProfile.address,
        website_url: this.userProfile.website_url,
        github_url: this.userProfile.github_url,
        linkedin_url: this.userProfile.linkedin_url,
      });

      this.settingsForm.patchValue({
        preferred_language: this.userProfile.preferred_language,
        theme_mode: this.userProfile.theme_mode,
        layout: this.userProfile.layout,
        notifications: this.userProfile.notifications,
        visibility_profile: this.userProfile.visibility_profile,
        visibility_achievements: this.userProfile.visibility_achievements,
        visibility_progress: this.userProfile.visibility_progress,
        visibility_activity: this.userProfile.visibility_activity,
      });
    }
  }

  // Edit mode management
  startEdit(mode: 'basic' | 'details' | 'settings' | 'password'): void {
    this.editMode = mode;
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editMode = 'none';
    this.updateForms();
    this.clearMessages();
  }

  // Form submission methods
  saveBasicProfile(): void {
    if (this.basicProfileForm.invalid) return;

    const formData: UpdateProfileRequest = this.basicProfileForm.value;
    this.isLoading = true;
    this.clearMessages();

    this.profileService
      .updateProfile(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.editMode = 'none';
          if (response.data) {
            this.user = response.data.user;
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'Không thể cập nhật profile';
          if (error.errors) {
            this.setFormErrors(this.basicProfileForm, error.errors);
          }
        },
      });
  }

  saveProfileDetails(): void {
    if (this.detailsForm.invalid) return;

    const formData: UpdateProfileDetailsRequest = this.detailsForm.value;
    this.isLoading = true;
    this.clearMessages();

    this.profileService
      .updateProfileDetails(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.editMode = 'none';
          if (response.data) {
            this.userProfile = response.data.profile;
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'Không thể cập nhật chi tiết profile';
          if (error.errors) {
            this.setFormErrors(this.detailsForm, error.errors);
          }
        },
      });
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) return;

    const formData: UpdateSettingsRequest = this.settingsForm.value;
    this.isLoading = true;
    this.clearMessages();

    this.profileService
      .updateSettings(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.editMode = 'none';
          if (response.data) {
            this.userProfile = response.data.profile;
          }

          // Apply theme changes immediately
          if (formData.theme_mode && formData.theme_mode !== 'system') {
            this.themeService.setTheme(formData.theme_mode as 'light' | 'dark');
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'Không thể cập nhật cài đặt';
          if (error.errors) {
            this.setFormErrors(this.settingsForm, error.errors);
          }
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const formData: ChangePasswordRequest = this.passwordForm.value;
    this.isLoading = true;
    this.clearMessages();

    this.profileService
      .changePassword(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.editMode = 'none';
          this.passwordForm.reset();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Không thể đổi mật khẩu';
          if (error.errors) {
            this.setFormErrors(this.passwordForm, error.errors);
          }
        },
      });
  }

  // Avatar upload methods
  onAvatarClick(): void {
    this.avatarFileInput.nativeElement.click();
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!this.isValidImageFile(file)) {
      this.errorMessage =
        'Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, GIF, WebP) dưới 5MB';
      return;
    }

    this.uploadAvatar(file);
  }

  private isValidImageFile(file: File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  private uploadAvatar(file: File): void {
    this.isUploading = true;
    this.clearMessages();

    this.profileService
      .uploadAvatar(file)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isUploading = false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          if (response.data) {
            this.user = response.data.user;
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'Không thể upload avatar';
        },
      });
  }

  // Utility methods
  private setFormErrors(
    form: FormGroup,
    errors: { [key: string]: string }
  ): void {
    Object.keys(errors).forEach((key) => {
      const control = form.get(key);
      if (control) {
        control.setErrors({ server: errors[key] });
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  getAvatarUrl(): string {
    return this.user ? this.profileService.getAvatarUrl(this.user) : '';
  }

  getProfileCompletion(): number {
    return this.userProfile
      ? this.profileService.getProfileCompletionPercentage(this.userProfile)
      : 0;
  }

  // Helper methods
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  setActiveTab(
    tab: 'overview' | 'courses' | 'analytics' | 'settings'
  ): void {
    this.activeTab = tab;
  }

  onPageChange(page: number): void {
    this.loadCreatorCourses(page);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getContestStatusColor(status?: string): string {
    return this.contestService.getContestStatusColor(status);
  }

  getContestStatusText(status?: string): string {
    switch (status) {
      case 'active':
        return 'Đang diễn ra';
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
    }
  }
}

