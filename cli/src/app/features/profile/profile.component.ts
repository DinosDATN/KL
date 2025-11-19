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
// Removed mock data imports - using real data from API

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

  // UI state
  activeTab: 'overview' | 'activity' | 'achievements' | 'courses' | 'settings' =
    'overview';
  editMode: 'none' | 'basic' | 'details' | 'settings' | 'password' = 'none';
  isLoading = false;
  isUploading = false;
  errorMessage = '';
  successMessage = '';

  // Forms
  basicProfileForm: FormGroup;
  detailsForm: FormGroup;
  settingsForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    public themeService: ThemeService,
    private profileService: ProfileService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.basicProfileForm = this.createBasicProfileForm();
    this.detailsForm = this.createDetailsForm();
    this.settingsForm = this.createSettingsForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    this.loadProfile();
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
          this.successMessage = response.message;
          this.editMode = 'none';
          if (response.data) {
            this.user = response.data.user;
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to update profile';
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
          this.errorMessage =
            error.message || 'Failed to update profile details';
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
          this.errorMessage = error.message || 'Failed to update settings';
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
          this.errorMessage = error.message || 'Failed to change password';
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
}
