import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  AdminCourse,
  AdminCourseService,
} from '../../../../../core/services/admin-course.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
})
export class CourseFormComponent implements OnInit {
  @Input() course: AdminCourse | null = null;
  @Input() isEdit = false;
  @Output() courseCreated = new EventEmitter<AdminCourse>();
  @Output() courseUpdated = new EventEmitter<AdminCourse>();
  @Output() close = new EventEmitter<void>();

  courseForm: FormGroup;
  loading = false;
  error: string | null = null;

  levels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  constructor(
    private fb: FormBuilder,
    private adminCourseService: AdminCourseService
  ) {
    this.courseForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.course && this.isEdit) {
      this.courseForm.patchValue(this.course);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      category_id: [1, Validators.required],
      level: ['Beginner', Validators.required],
      duration: [0, [Validators.min(0)]],
      price: [0, [Validators.min(0)]],
      original_price: [0, [Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      is_premium: [false],
      status: ['draft', Validators.required],
      thumbnail: [''],
      instructor_id: [null],
    });
  }

  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.courseForm.value;

    const operation =
      this.isEdit && this.course
        ? this.adminCourseService.updateCourse(this.course.id, formValue)
        : this.adminCourseService.createCourse(formValue);

    operation.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (this.isEdit) {
            this.courseUpdated.emit(response.data);
          } else {
            this.courseCreated.emit(response.data);
          }
        }
      },
      error: (error) => {
        this.error = error.message || 'Failed to save course';
        this.loading = false;
      },
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onCancel(): void {
    this.close.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.courseForm.controls).forEach((key) => {
      this.courseForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.courseForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
      if (field.errors['max']) return `${fieldName} must be less than 100`;
    }
    return null;
  }
}
