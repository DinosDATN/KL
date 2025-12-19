import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
import { AuthService } from '../../core/services/auth.service';
import {
  User,
  UserProfile,
  UserStat,
  UserGoal,
  Achievement,
  UserAchievement,
  UserActivityLog,
} from '../../core/models/user.model';
import { Course, CourseEnrollment } from '../../core/models/course.model';
import { Problem, Submission } from '../../core/models/problem.model';
import { CoursesService } from '../../core/services/courses.service';
// Removed mock data imports - using real data from API

interface PendingPayment {
  id: number;
  amount: number;
  payment_method: string;
  created_at: string;
  Course: Course;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('avatarFileInput') avatarFileInput!: ElementRef<HTMLInputElement>;

  private destroy$ = new Subject<void>();

  // Data properties
  user: User | null = null;
  userProfile: UserProfile | null = null;
  userStat: UserStat | null = null;

  // Data from API
  userGoals: UserGoal[] = [];
  userAchievements: UserAchievement[] = [];
  userActivityLogs: UserActivityLog[] = [];
  courseEnrollments: CourseEnrollment[] = [];
  submissions: Submission[] = [];
  pendingPayments: PendingPayment[] = [];

  // UI state
  activeTab: 'overview' | 'activity' | 'achievements' | 'courses' | 'settings' =
    'overview';
  editMode: 'none' | 'basic' | 'details' | 'settings' | 'password' = 'none';
  isLoading = false;
  isUploading = false;
  errorMessage = '';
  successMessage = '';
  creatorApplicationError = '';

  // Forms
  basicProfileForm: FormGroup;
  detailsForm: FormGroup;
  settingsForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    public themeService: ThemeService,
    private profileService: ProfileService,
    private authService: AuthService,
    private coursesService: CoursesService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
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
          // Only load profile if user is authenticated
          if (this.authService.isAuthenticated()) {
            // Check if user is creator or admin, redirect to creator profile
            const currentUser = this.authService.getCurrentUser();
            if (currentUser && (currentUser.role === 'creator' || currentUser.role === 'admin')) {
              this.router.navigate(['/creator/profile']);
              return;
            }
            this.loadProfile();
          } else {
            // User not authenticated, redirect to login
            this.errorMessage = 'Please login to view your profile';
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

          // Load additional data from API response
          this.userGoals = profileData.goals || [];
          this.userAchievements = profileData.achievements || [];
          this.userActivityLogs = profileData.activity_logs || [];
          this.courseEnrollments = profileData.enrollments || [];
          this.submissions = profileData.recent_submissions || [];

          this.updateForms();
          
          // Load pending payments for courses tab
          this.loadPendingPayments();
          
          // Check for fragment to set active tab
          this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(fragment => {
            if (fragment === 'courses') {
              this.activeTab = 'courses';
            }
          });
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to load profile';
          console.error('Error loading profile:', error);
        },
      });
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
          this.successMessage = response.message || 'Cập nhật profile thành công!';
          this.editMode = 'none';
          if (response.data) {
            this.user = response.data.user;
          }
          // Reload profile to get latest data
          this.loadProfile();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Không thể cập nhật profile. Vui lòng thử lại.';
          if (error.error?.errors) {
            this.setFormErrors(this.basicProfileForm, error.error.errors);
          }
        },
      });
  }

  saveProfileDetails(): void {
    if (this.detailsForm.invalid) return;

    const formValue = this.detailsForm.value;
    // Filter out empty strings and convert to undefined/null for optional fields
    // Helper function to clean string values
    const cleanStringValue = (value: any): string | undefined => {
      if (!value || typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    };
    
    // Helper function to clean gender value (must be one of the allowed values)
    const cleanGenderValue = (value: any): 'male' | 'female' | 'other' | undefined => {
      if (!value || typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      if (trimmed === 'male' || trimmed === 'female' || trimmed === 'other') {
        return trimmed;
      }
      return undefined;
    };
    
    const formData: UpdateProfileDetailsRequest = {
      bio: cleanStringValue(formValue.bio),
      birthday: cleanStringValue(formValue.birthday),
      gender: cleanGenderValue(formValue.gender),
      phone: cleanStringValue(formValue.phone),
      address: cleanStringValue(formValue.address),
      website_url: cleanStringValue(formValue.website_url),
      github_url: cleanStringValue(formValue.github_url),
      linkedin_url: cleanStringValue(formValue.linkedin_url),
    };
    
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
          this.successMessage = response.message || 'Cập nhật thông tin chi tiết thành công!';
          this.editMode = 'none';
          if (response.data) {
            this.userProfile = response.data.profile;
          }
          // Reload profile to get latest data
          this.loadProfile();
        },
        error: (error) => {
          console.error('Error updating profile details:', error);
          console.error('Error response:', error.error);
          console.error('Request data sent:', formData);
          
          // Extract error message
          let errorMsg = 'Không thể cập nhật thông tin chi tiết. Vui lòng thử lại.';
          
          if (error.error) {
            if (error.error.message) {
              errorMsg = error.error.message;
            } else if (error.error.error) {
              errorMsg = error.error.error;
            }
            
            // Add field-specific errors if available
            if (error.error.errors) {
              const fieldErrors = Object.keys(error.error.errors)
                .map(key => `${key}: ${error.error.errors[key]}`)
                .join(', ');
              if (fieldErrors) {
                errorMsg += ` (${fieldErrors})`;
              }
              this.setFormErrors(this.detailsForm, error.error.errors);
            }
          } else if (error.message) {
            errorMsg = error.message;
          }
          
          this.errorMessage = errorMsg;
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
          this.successMessage = response.message || 'Cập nhật cài đặt thành công!';
          this.editMode = 'none';
          if (response.data) {
            this.userProfile = response.data.profile;
          }

          // Apply theme changes immediately
          if (formData.theme_mode && formData.theme_mode !== 'system') {
            this.themeService.setTheme(formData.theme_mode as 'light' | 'dark');
          }
          
          // Reload profile to get latest data
          this.loadProfile();
        },
        error: (error) => {
          console.error('Error updating settings:', error);
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Không thể cập nhật cài đặt. Vui lòng thử lại.';
          if (error.error?.errors) {
            this.setFormErrors(this.settingsForm, error.error.errors);
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
          this.errorMessage = error.message || 'Failed to change password';
          if (error.errors) {
            this.setFormErrors(this.passwordForm, error.errors);
          }
        },
      });
  }

  // Become creator
  becomeCreator(): void {
    if (
      !confirm(
        'Bạn có chắc chắn muốn đăng ký trở thành người sáng tạo nội dung? Bạn sẽ có thể tạo và quản lý khóa học.'
      )
    ) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.profileService
      .becomeCreator()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response.message ||
            'Đăng ký thành công! Bạn đã trở thành người sáng tạo nội dung.';
          if (response.data && response.data.user) {
            this.user = response.data.user;
            // Update auth service to reflect new role
            this.authService.getProfile().subscribe();
          }
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Không thể đăng ký làm người sáng tạo nội dung';
        },
      });
  }

  // Check if user is already a creator
  isCreator(): boolean {
    return this.user?.role === 'creator' || this.user?.role === 'admin';
  }

  // Handle become creator button click
  onBecomeCreatorClick(): void {
    this.creatorApplicationError = '';
    
    // Check if profile is complete
    if (!this.userProfile) {
      this.creatorApplicationError = 'Vui lòng hoàn thành thông tin profile trước khi đăng ký trở thành Creator.';
      return;
    }

    const requiredFields = ['bio', 'phone', 'address'];
    const missingFields = requiredFields.filter(
      (field) => !this.userProfile![field as keyof UserProfile]
    );

    if (missingFields.length > 0) {
      const fieldNames: { [key: string]: string } = {
        bio: 'tiểu sử',
        phone: 'số điện thoại',
        address: 'địa chỉ',
      };
      const missingFieldNames = missingFields
        .map((field) => fieldNames[field] || field)
        .join(', ');
      this.creatorApplicationError = `Vui lòng hoàn thành thông tin profile trước: ${missingFieldNames}`;
      return;
    }

    // Profile is complete, navigate to application page
    this.router.navigate(['/profile/creator-application']);
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
        'Please select a valid image file (JPEG, PNG, GIF, WebP) under 5MB';
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
          this.errorMessage = error.message || 'Failed to upload avatar';
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

  getProgressPercentage(current: number, target: number): number {
    return Math.min((current / target) * 100, 100);
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'course_started':
        return '📚';
      case 'course_completed':
        return '🎓';
      case 'quiz_taken':
        return '📝';
      case 'problem_solved':
        return '✅';
      case 'badge_earned':
        return '🏆';
      case 'course_published':
        return '📖';
      default:
        return '⚡';
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
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
    tab: 'overview' | 'activity' | 'achievements' | 'courses' | 'settings'
  ): void {
    this.activeTab = tab;
  }

  // Get user's completed achievements
  getUserAchievements(): { achievement: Achievement; dateEarned: string }[] {
    return this.userAchievements
      .filter((ua) => ua.achievement) // Only include achievements with achievement data
      .map((ua) => ({
        achievement: ua.achievement as Achievement,
        dateEarned: ua.date_earned,
      }));
  }

  // Get user's enrolled courses with progress
  getUserCourses(): { course: Course; enrollment: CourseEnrollment }[] {
    return this.courseEnrollments
      .filter((enrollment) => enrollment.course) // Only include enrollments with course data
      .map((enrollment) => ({
        course: enrollment.course as Course,
        enrollment,
      }));
  }

  // Get recent submissions
  getRecentSubmissions(): { submission: Submission; problem: Problem }[] {
    return this.submissions
      .filter((submission) => submission.problem) // Only include submissions with problem data
      .map((submission) => ({
        submission,
        problem: submission.problem as Problem,
      }))
      .sort(
        (a, b) =>
          new Date(b.submission.submitted_at).getTime() -
          new Date(a.submission.submitted_at).getTime()
      )
      .slice(0, 5);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'wrong-answer':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'time-limit-exceeded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  // Load pending payments for courses tab
  private loadPendingPayments(): void {
    this.coursesService.getMyPayments('pending')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.pendingPayments = response.data || [];
        },
        error: (error) => {
          console.error('Failed to load pending payments:', error);
        }
      });
  }

  // Utility methods for courses tab
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getProgressColor(progress: number): string {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'not-started': return 'Chưa bắt đầu';
      case 'in-progress': return 'Đang học';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  }

  getEnrollmentStatusColor(status: string): string {
    switch (status) {
      case 'not-started': return 'text-gray-600 bg-gray-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Navigation methods for courses
  goToCourse(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }

  startLearning(courseId: number): void {
    this.router.navigate(['/courses', courseId, 'learn']);
  }

  refreshCoursesData(): void {
    this.loadProfile();
  }
}
