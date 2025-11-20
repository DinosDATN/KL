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
  FormArray,
  Validators,
} from '@angular/forms';
import {
  AdminCourse,
  AdminCourseService,
} from '../../../../../core/services/admin-course.service';
import { CoursesService } from '../../../../../core/services/courses.service';
import { CourseCategory } from '../../../../../core/models/course.model';
import { User } from '../../../../../core/models/user.model';
import {
  CourseModule,
  CourseLesson,
} from '../../../../../core/models/course-module.model';

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
  categories: CourseCategory[] = [];
  instructors: User[] = [];
  loadingCategories = false;
  loadingInstructors = false;
  showModulesSection = false;
  uploadingThumbnail = false;
  thumbnailPreview: string | null = null;

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

  lessonTypes = [
    { value: 'document', label: 'Document' },
    { value: 'video', label: 'Video' },
    { value: 'exercise', label: 'Exercise' },
    { value: 'quiz', label: 'Quiz' },
  ];

  constructor(
    private fb: FormBuilder,
    private adminCourseService: AdminCourseService,
    private coursesService: CoursesService
  ) {
    this.courseForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadInstructors();

    if (this.course && this.isEdit) {
      this.courseForm.patchValue(this.course);
    }
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.coursesService.getCourseCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
        this.loadingCategories = false;
      },
    });
  }

  loadInstructors(): void {
    this.loadingInstructors = true;
    this.coursesService.getInstructors().subscribe({
      next: (instructors) => {
        this.instructors = instructors;
        this.loadingInstructors = false;
      },
      error: (error) => {
        console.error('Failed to load instructors:', error);
        this.loadingInstructors = false;
      },
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      category_id: [null, Validators.required],
      level: ['Beginner', Validators.required],
      duration: [0, [Validators.min(0)]],
      price: [0, [Validators.min(0)]],
      original_price: [0, [Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      is_premium: [false],
      is_free: [true], // Default to true
      status: ['draft', Validators.required],
      thumbnail: [''],
      instructor_id: [null],
      modules: this.fb.array([]),
    });
  }

  get modulesFormArray(): FormArray {
    return this.courseForm.get('modules') as FormArray;
  }

  addModule(): void {
    const moduleForm = this.fb.group({
      title: ['', Validators.required],
      position: [this.modulesFormArray.length + 1],
      lessons: this.fb.array([]),
    });
    this.modulesFormArray.push(moduleForm);
    this.showModulesSection = true;
  }

  removeModule(index: number): void {
    this.modulesFormArray.removeAt(index);
    // Update positions
    this.modulesFormArray.controls.forEach((control, i) => {
      control.patchValue({ position: i + 1 });
    });
  }

  getModuleLessons(moduleIndex: number): FormArray {
    return this.modulesFormArray.at(moduleIndex).get('lessons') as FormArray;
  }

  addLesson(moduleIndex: number): void {
    const lessonsArray = this.getModuleLessons(moduleIndex);
    const lessonForm = this.fb.group({
      title: ['', Validators.required],
      content: [''],
      duration: [0, [Validators.min(0)]],
      position: [lessonsArray.length + 1],
      type: ['document', Validators.required],
      videoFile: [null], // For video upload
    });
    lessonsArray.push(lessonForm);
  }

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadingThumbnail = true;

      this.adminCourseService.uploadThumbnail(file).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.courseForm.patchValue({ thumbnail: response.data.file_url });
            this.thumbnailPreview = response.data.file_url;
            this.uploadingThumbnail = false;
          }
        },
        error: (error) => {
          console.error('Error uploading thumbnail:', error);
          this.error = error.error?.message || 'Failed to upload thumbnail';
          this.uploadingThumbnail = false;
        },
      });
    }
  }

  onVideoSelected(
    event: Event,
    moduleIndex: number,
    lessonIndex: number
  ): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const lesson = this.getModuleLessons(moduleIndex).at(lessonIndex);

      this.adminCourseService.uploadVideo(file).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            lesson.patchValue({
              content: response.data.file_url,
              videoFile: file,
            });
          }
        },
        error: (error) => {
          console.error('Error uploading video:', error);
          this.error = error.error?.message || 'Failed to upload video';
        },
      });
    }
  }

  removeLesson(moduleIndex: number, lessonIndex: number): void {
    const lessonsArray = this.getModuleLessons(moduleIndex);
    lessonsArray.removeAt(lessonIndex);
    // Update positions
    lessonsArray.controls.forEach((control, i) => {
      control.patchValue({ position: i + 1 });
    });
  }

  toggleModulesSection(): void {
    this.showModulesSection = !this.showModulesSection;
  }

  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.courseForm.value;

    // Prepare course data
    const courseData: any = {
      title: formValue.title,
      description: formValue.description,
      category_id: formValue.category_id,
      level: formValue.level,
      duration: formValue.duration,
      price: formValue.price,
      original_price: formValue.original_price,
      discount: formValue.discount,
      is_premium: formValue.is_premium,
      is_free:
        formValue.is_free !== undefined
          ? formValue.is_free
          : !formValue.is_premium,
      status: formValue.status,
      thumbnail: formValue.thumbnail,
      instructor_id: formValue.instructor_id,
    };

    // Add modules and lessons if provided
    if (formValue.modules && formValue.modules.length > 0) {
      courseData.modules = formValue.modules.map((module: any) => ({
        title: module.title,
        position: module.position,
        lessons: module.lessons
          ? module.lessons.map((lesson: any) => ({
              title: lesson.title,
              content: lesson.content,
              duration: lesson.duration,
              position: lesson.position,
              type: lesson.type,
            }))
          : [],
      }));
    }

    const operation =
      this.isEdit && this.course
        ? this.adminCourseService.updateCourse(this.course.id, courseData)
        : this.adminCourseService.createCourse(courseData);

    operation.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loading = false;
          if (this.isEdit) {
            this.courseUpdated.emit(response.data);
          } else {
            this.courseCreated.emit(response.data);
          }
        }
      },
      error: (error) => {
        this.error =
          error.error?.message || error.message || 'Failed to save course';
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
