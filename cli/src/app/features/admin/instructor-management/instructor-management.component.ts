import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BaseAdminComponent } from '../base-admin.component';
import { 
  AdminInstructorService, 
  AdminInstructor, 
  InstructorFilters, 
  InstructorStatistics,
  InstructorDetail,
  InstructorQualification,
  UpdateInstructorRequest,
  CreateQualificationRequest,
  UpdateQualificationRequest
} from '../../../core/services/admin-instructor.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-instructor-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './instructor-management.component.html',
  styleUrls: ['./instructor-management.component.css']
})
export class InstructorManagementComponent extends BaseAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  instructors: AdminInstructor[] = [];
  statistics: InstructorStatistics | null = null;
  totalInstructors = 0;
  isLoading = true;
  isLoadingStats = true;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  pagination: any = null;
  
  // Filters
  filterForm: FormGroup;
  
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];
  
  sortOptions = [
    { value: 'created_at', label: 'Registration Date' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'courses_count', label: 'Courses Count' },
    { value: 'students_count', label: 'Students Count' },
    { value: 'avg_rating', label: 'Average Rating' }
  ];
  
  // Modal states
  showDetailsModal = false;
  showEditModal = false;
  showQualificationModal = false;
  showDeleteQualificationModal = false;
  selectedInstructor: AdminInstructor | null = null;
  selectedInstructorDetail: InstructorDetail | null = null;
  isLoadingDetail = false;
  
  // Forms
  editForm: FormGroup;
  qualificationForm: FormGroup;
  
  selectedQualification: InstructorQualification | null = null;
  isEditingQualification = false;
  isSaving = false;
  isDeleting = false;
  
  // Expose Math for template
  Math = Math;

  constructor(
    public themeService: ThemeService,
    private instructorService: AdminInstructorService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    authService: AuthService,
    router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
    this.filterForm = this.fb.group({
      search: [''],
      is_active: [''],
      has_courses: [''],
      min_courses: [''],
      min_students: [''],
      min_rating: [''],
      sortBy: ['created_at'],
      registration_date: ['']
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      is_active: [true],
      subscription_status: ['free']
    });

    this.qualificationForm = this.fb.group({
      title: ['', [Validators.required]],
      institution: [''],
      date: [''],
      credential_url: ['']
    });
  }

  ngOnInit() {
    // ✅ Only run in browser, not during SSR
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        this.setupFilterSubscription();
        this.loadStatistics();
        this.loadInstructors();
      }
    });
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
        this.loadInstructors();
      });
  }

  loadStatistics() {
    // ✅ Skip during SSR
    if (!this.isBrowser) {
      return;
    }

    this.isLoadingStats = true;
    this.instructorService.getStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.statistics = response.data;
          }
          this.isLoadingStats = false;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          this.isLoadingStats = false;
        }
      });
  }

  loadInstructors() {
    // ✅ Skip during SSR
    if (!this.isBrowser) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    
    const filters: InstructorFilters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...this.filterForm.value
    };
    
    // Remove empty filter values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof InstructorFilters] === '') {
        delete filters[key as keyof InstructorFilters];
      }
    });

    this.instructorService.getInstructors(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.instructors = response.data || [];
            this.pagination = response.pagination;
            this.totalInstructors = response.pagination?.total_items || 0;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading instructors:', error);
          this.error = error.error?.message || 'Failed to load instructors';
          this.isLoading = false;
        }
      });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadInstructors();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadInstructors();
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      is_active: '',
      has_courses: '',
      min_courses: '',
      min_students: '',
      min_rating: '',
      sortBy: 'created_at',
      registration_date: ''
    });
    this.currentPage = 1;
  }

  // TrackBy function for better performance
  trackByInstructorId(index: number, instructor: AdminInstructor): number {
    return instructor.id;
  }
  
  toggleInstructorStatus(instructor: AdminInstructor) {
    this.instructorService.toggleInstructorStatus(instructor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const index = this.instructors.findIndex(i => i.id === instructor.id);
            if (index > -1) {
              this.instructors[index] = {
                ...this.instructors[index],
                ...response.data
              };
            }
            this.notificationService.success(
              'Thành công', 
              `Instructor ${response.data.is_active ? 'activated' : 'deactivated'} successfully`
            );
          }
        },
        error: (error) => {
          console.error('Error toggling instructor status:', error);
          this.notificationService.error('Lỗi', error.error?.message || 'Failed to toggle instructor status');
        }
      });
  }

  viewInstructorDetails(instructor: AdminInstructor) {
    this.selectedInstructor = instructor;
    this.isLoadingDetail = true;
    this.showDetailsModal = true;
    
    this.instructorService.getInstructor(instructor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.selectedInstructorDetail = response.data;
          }
          this.isLoadingDetail = false;
        },
        error: (error) => {
          console.error('Error loading instructor details:', error);
          this.notificationService.error('Lỗi', error.error?.message || 'Failed to load instructor details');
          this.isLoadingDetail = false;
        }
      });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedInstructor = null;
    this.selectedInstructorDetail = null;
  }

  openEditModal(instructor: AdminInstructor) {
    this.selectedInstructor = instructor;
    this.editForm.patchValue({
      name: instructor.name,
      email: instructor.email,
      is_active: instructor.is_active,
      subscription_status: instructor.subscription_status
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedInstructor = null;
    this.editForm.reset();
  }

  saveInstructor() {
    if (this.editForm.invalid || !this.selectedInstructor) return;

    this.isSaving = true;
    const updateData: UpdateInstructorRequest = this.editForm.value;

    this.instructorService.updateInstructor(this.selectedInstructor.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const index = this.instructors.findIndex(i => i.id === this.selectedInstructor!.id);
            if (index > -1) {
              this.instructors[index] = {
                ...this.instructors[index],
                ...response.data
              };
            }
            this.notificationService.success('Thành công', 'Instructor updated successfully');
            this.closeEditModal();
            this.loadInstructors(); // Reload to refresh statistics
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating instructor:', error);
          this.notificationService.error('Lỗi', error.error?.message || 'Failed to update instructor');
          this.isSaving = false;
        }
      });
  }

  openQualificationModal(instructor: AdminInstructor, qualification?: InstructorQualification) {
    this.selectedInstructor = instructor;
    this.isEditingQualification = !!qualification;
    this.selectedQualification = qualification || null;
    
    if (qualification) {
      this.qualificationForm.patchValue({
        title: qualification.title,
        institution: qualification.institution || '',
        date: qualification.date || '',
        credential_url: qualification.credential_url || ''
      });
    } else {
      this.qualificationForm.reset({
        title: '',
        institution: '',
        date: '',
        credential_url: ''
      });
    }
    
    this.showQualificationModal = true;
  }

  closeQualificationModal() {
    this.showQualificationModal = false;
    this.selectedInstructor = null;
    this.selectedQualification = null;
    this.isEditingQualification = false;
    this.qualificationForm.reset();
  }

  saveQualification() {
    if (this.qualificationForm.invalid || !this.selectedInstructor) return;

    this.isSaving = true;
    const qualificationData: CreateQualificationRequest | UpdateQualificationRequest = this.qualificationForm.value;

    if (this.isEditingQualification && this.selectedQualification) {
      // Update existing qualification
      this.instructorService.updateQualification(
        this.selectedInstructor.id,
        this.selectedQualification.id,
        qualificationData
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.notificationService.success('Thành công', 'Qualification updated successfully');
              this.closeQualificationModal();
              if (this.selectedInstructorDetail) {
                this.viewInstructorDetails(this.selectedInstructor!);
              }
            }
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error updating qualification:', error);
            this.notificationService.error('Lỗi', error.error?.message || 'Failed to update qualification');
            this.isSaving = false;
          }
        });
    } else {
      // Create new qualification
      this.instructorService.createQualification(this.selectedInstructor.id, qualificationData as CreateQualificationRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.notificationService.success('Thành công', 'Qualification added successfully');
              this.closeQualificationModal();
              if (this.selectedInstructorDetail) {
                this.viewInstructorDetails(this.selectedInstructor!);
              }
            }
            this.isSaving = false;
          },
          error: (error) => {
            console.error('Error creating qualification:', error);
            this.notificationService.error('Lỗi', error.error?.message || 'Failed to create qualification');
            this.isSaving = false;
          }
        });
    }
  }

  confirmDeleteQualification(qualification: InstructorQualification) {
    this.selectedQualification = qualification;
    this.showDeleteQualificationModal = true;
  }

  deleteQualification() {
    if (!this.selectedInstructor || !this.selectedQualification) return;

    this.isDeleting = true;
    this.instructorService.deleteQualification(this.selectedInstructor.id, this.selectedQualification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Thành công', 'Qualification deleted successfully');
            this.showDeleteQualificationModal = false;
            this.selectedQualification = null;
            if (this.selectedInstructorDetail) {
              this.viewInstructorDetails(this.selectedInstructor!);
            }
          }
          this.isDeleting = false;
        },
        error: (error) => {
          console.error('Error deleting qualification:', error);
          this.notificationService.error('Lỗi', error.error?.message || 'Failed to delete qualification');
          this.isDeleting = false;
        }
      });
  }

  closeDeleteQualificationModal() {
    this.showDeleteQualificationModal = false;
    this.selectedQualification = null;
  }
}
