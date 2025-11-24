import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { CreatorApplicationService } from '../../../core/services/creator-application.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreatorApplicationFormData, WorkExperience, Certificate, PortfolioItem } from '../../../core/models/creator-application.model';

@Component({
  selector: 'app-creator-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creator-application.component.html',
  styleUrls: ['./creator-application.component.css'],
})
export class CreatorApplicationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  applicationForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  hasPendingApplication = false;
  currentApplication: any = null;

  specializations = [
    'Web Development',
    'Mobile Development',
    'AI/ML',
    'DevOps',
    'Data Science',
    'Cybersecurity',
    'Cloud Computing',
    'Game Development',
    'UI/UX Design',
    'Other',
  ];

  portfolioTypes = [
    { value: 'github', label: 'GitHub' },
    { value: 'gitlab', label: 'GitLab' },
    { value: 'website', label: 'Website cá nhân' },
    { value: 'product', label: 'Sản phẩm cá nhân' },
    { value: 'other', label: 'Khác' },
  ];

  certificateTypes = [
    'Udemy',
    'Coursera',
    'Google Cert',
    'AWS Cert',
    'Microsoft Cert',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    private creatorApplicationService: CreatorApplicationService,
    private profileService: ProfileService,
    private authService: AuthService,
    public router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    try {
      this.checkExistingApplication();
      this.checkProfileCompletion();
    } catch (error) {
      console.error('Error initializing creator application component:', error);
      // Don't let initialization errors break the component
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.applicationForm = this.fb.group({
      specialization: ['', [Validators.required]],
      work_experience: this.fb.array([this.createWorkExperienceGroup()]),
      skills: this.fb.array([this.fb.control('', Validators.required)]),
      certificates: this.fb.array([]),
      portfolio: this.fb.array([]),
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(1000)]],
      teaching_experience: [''],
    });
  }

  createWorkExperienceGroup(): FormGroup {
    return this.fb.group({
      years: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      position: ['', [Validators.required]],
      company: ['', [Validators.required]],
    });
  }

  get workExperienceArray(): FormArray {
    return this.applicationForm.get('work_experience') as FormArray;
  }

  get skillsArray(): FormArray {
    return this.applicationForm.get('skills') as FormArray;
  }

  get certificatesArray(): FormArray {
    return this.applicationForm.get('certificates') as FormArray;
  }

  get portfolioArray(): FormArray {
    return this.applicationForm.get('portfolio') as FormArray;
  }

  addWorkExperience(): void {
    this.workExperienceArray.push(this.createWorkExperienceGroup());
  }

  removeWorkExperience(index: number): void {
    if (this.workExperienceArray.length > 1) {
      this.workExperienceArray.removeAt(index);
    }
  }

  addSkill(): void {
    this.skillsArray.push(this.fb.control('', Validators.required));
  }

  removeSkill(index: number): void {
    if (this.skillsArray.length > 1) {
      this.skillsArray.removeAt(index);
    }
  }

  addCertificate(): void {
    this.certificatesArray.push(
      this.fb.group({
        type: ['', Validators.required],
        url: [''],
        file_url: [''],
      })
    );
  }

  removeCertificate(index: number): void {
    this.certificatesArray.removeAt(index);
  }

  addPortfolioItem(): void {
    this.portfolioArray.push(
      this.fb.group({
        type: ['', Validators.required],
        url: ['', [Validators.required]],
      })
    );
  }

  removePortfolioItem(index: number): void {
    this.portfolioArray.removeAt(index);
  }

  checkExistingApplication(): void {
    this.creatorApplicationService
      .getMyApplication()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (application) => {
          this.currentApplication = application;
          this.hasPendingApplication = application.status === 'pending';
          if (application.status === 'approved') {
            // User is already approved, redirect or show message
            this.successMessage = 'Bạn đã được phê duyệt làm creator!';
          }
        },
        error: (error) => {
          // No application found (404) - allow to create new
          // Other errors should be logged but not block the form
          if (error.status === 404) {
            // This is expected - user doesn't have an application yet
            this.currentApplication = null;
            this.hasPendingApplication = false;
          } else {
            console.error('Error checking application:', error);
            // Don't show error to user for non-critical errors
            // Just allow them to proceed with the form
          }
        },
      });
  }

  checkProfileCompletion(): void {
    this.profileService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data && data.profile) {
            const profile = data.profile;
            const requiredFields = ['bio', 'phone', 'address'];
            const missingFields = requiredFields.filter((field) => !profile[field as keyof typeof profile]);
            if (missingFields.length > 0) {
              this.errorMessage = `Vui lòng hoàn thành thông tin profile trước: ${missingFields.join(', ')}`;
            }
          }
        },
        error: (error) => {
          // Don't block the form if profile check fails
          // Just log the error
          console.error('Error checking profile:', error);
        },
      });
  }

  onSubmit(): void {
    if (this.applicationForm.invalid) {
      this.markFormGroupTouched(this.applicationForm);
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin bắt buộc';
      return;
    }

    if (this.hasPendingApplication) {
      this.errorMessage = 'Bạn đã có một đơn đăng ký đang chờ duyệt';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.applicationForm.value;

    // Prepare application data
    // Flatten skills array - each item might be comma-separated
    const allSkills: string[] = [];
    formValue.skills.forEach((skillStr: string) => {
      if (skillStr && skillStr.trim()) {
        // Split by comma and trim each skill
        const skills = skillStr.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        allSkills.push(...skills);
      }
    });

    const applicationData: CreatorApplicationFormData = {
      specialization: formValue.specialization,
      work_experience: formValue.work_experience as WorkExperience[],
      skills: allSkills,
      bio: formValue.bio,
      teaching_experience: formValue.teaching_experience || undefined,
      certificates:
        formValue.certificates.length > 0
          ? (formValue.certificates as Certificate[])
          : undefined,
      portfolio:
        formValue.portfolio.length > 0
          ? (formValue.portfolio as PortfolioItem[])
          : undefined,
    };

    this.creatorApplicationService
      .submitApplication(applicationData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response.message ||
            'Đơn đăng ký đã được gửi thành công! Vui lòng chờ admin duyệt.';
          this.hasPendingApplication = true;
          this.currentApplication = response.data;
          // Refresh user profile to get updated role if approved immediately
          this.authService.getProfile().subscribe();
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message ||
            error.message ||
            'Không thể gửi đơn đăng ký. Vui lòng thử lại.';
          if (error.error?.errors) {
            // Handle field-specific errors
            Object.keys(error.error.errors).forEach((key) => {
              const control = this.applicationForm.get(key);
              if (control) {
                control.setErrors({ serverError: error.error.errors[key] });
              }
            });
          }
        },
      });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  getApplicationStatusText(): string {
    if (!this.currentApplication) return '';
    switch (this.currentApplication.status) {
      case 'pending':
        return 'Đang chờ duyệt';
      case 'approved':
        return 'Đã được duyệt';
      case 'rejected':
        return 'Đã bị từ chối';
      default:
        return '';
    }
  }

  getApplicationStatusClass(): string {
    if (!this.currentApplication) return '';
    switch (this.currentApplication.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return '';
    }
  }
}

