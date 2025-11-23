import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
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
  CreatorCourse,
  CreatorCourseService,
} from '../../../../../core/services/creator-course.service';
import { CoursesService } from '../../../../../core/services/courses.service';
import { CourseCategory } from '../../../../../core/models/course.model';
import {
  CourseModule,
  CourseLesson,
} from '../../../../../core/models/course-module.model';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-creator-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creator-course-form.component.html',
  styleUrl: './creator-course-form.component.css',
})
export class CreatorCourseFormComponent implements OnInit, OnChanges {
  @Input() course: CreatorCourse | null = null;
  @Input() isEdit = false;
  @Output() courseCreated = new EventEmitter<CreatorCourse>();
  @Output() courseUpdated = new EventEmitter<CreatorCourse>();
  @Output() close = new EventEmitter<void>();

  courseForm!: FormGroup;
  loading = false;
  error: string | null = null;
  categories: CourseCategory[] = [];
  loadingCategories = false;
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
    private creatorCourseService: CreatorCourseService,
    private coursesService: CoursesService,
    private notificationService: NotificationService
  ) {
    try {
      console.log('CreatorCourseFormComponent constructor');
      this.courseForm = this.createForm();
      console.log('Form created successfully');
    } catch (error) {
      console.error('Error in CreatorCourseFormComponent constructor:', error);
      // Tạo form rỗng nếu có lỗi để tránh crash
      try {
        this.courseForm = this.fb.group({
          title: [''],
          description: [''],
          category_id: [null],
          level: ['Beginner'],
          duration: [0],
          price: [0],
          original_price: [0],
          discount: [0],
          is_premium: [false],
          is_free: [true],
          status: ['draft'],
          thumbnail: [''],
          modules: this.fb.array([]),
        });
      } catch (e) {
        console.error('Failed to create fallback form:', e);
      }
    }
  }

  ngOnInit(): void {
    try {
      console.log('CreatorCourseFormComponent ngOnInit');
      this.loadCategories();

      if (this.course && this.isEdit) {
        this.populateForm(this.course);
      }
    } catch (error) {
      console.error('Error in CreatorCourseFormComponent ngOnInit:', error);
      this.error = 'Lỗi khi khởi tạo form';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle course changes (e.g., when loading full details from API)
    if (changes['course'] && this.course && this.isEdit && this.courseForm) {
      this.populateForm(this.course);
    }
  }

  private populateForm(course: CreatorCourse): void {
    // Patch form with course data
    this.courseForm.patchValue({
      title: course.title || '',
      description: course.description || '',
      category_id: course.category_id || null,
      level: course.level || 'Beginner',
      duration: course.duration || 0,
      price: course.price || 0,
      original_price: course.original_price || course.price || 0,
      discount: course.discount || 0,
      is_premium: course.is_premium || false,
      is_free: course.is_free !== undefined ? course.is_free : !course.is_premium,
      status: course.status || 'draft',
      thumbnail: course.thumbnail || '',
    });

    // Hiển thị ảnh hiện tại nếu có
    if (course.thumbnail) {
      this.thumbnailPreview = course.thumbnail;
    }
  }

  loadCategories(): void {
    try {
      this.loadingCategories = true;
      this.coursesService.getCourseCategories().subscribe({
        next: (categories) => {
          this.categories = categories || [];
          this.loadingCategories = false;
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
          this.categories = [];
          this.loadingCategories = false;
          // Không hiển thị lỗi để tránh làm gián đoạn form
        },
      });
    } catch (error) {
      console.error('Error in loadCategories:', error);
      this.categories = [];
      this.loadingCategories = false;
    }
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

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Lỗi', 'Vui lòng chọn file ảnh hợp lệ');
        input.value = ''; // Reset input
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.notificationService.error(
          'Lỗi',
          'Kích thước file không được vượt quá 5MB'
        );
        input.value = ''; // Reset input
        return;
      }

      this.uploadingThumbnail = true;
      this.error = null;

      this.creatorCourseService.uploadThumbnail(file).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.courseForm.patchValue({ thumbnail: response.data.file_url });
            this.thumbnailPreview = response.data.file_url;
            this.uploadingThumbnail = false;
            this.notificationService.success(
              'Thành công',
              'Ảnh đã được tải lên thành công'
            );
          } else {
            this.uploadingThumbnail = false;
            this.error = 'Failed to upload thumbnail';
            this.notificationService.error('Lỗi', 'Không thể tải lên ảnh');
          }
        },
        error: (error) => {
          console.error('Error uploading thumbnail:', error);
          this.error = error.error?.message || 'Failed to upload thumbnail';
          this.uploadingThumbnail = false;
          this.notificationService.error(
            'Lỗi',
            error.error?.message || 'Không thể tải lên ảnh'
          );
          input.value = ''; // Reset input on error
        },
      });
    }
  }

  removeThumbnail(): void {
    this.thumbnailPreview = null;
    this.courseForm.patchValue({ thumbnail: '' });
    // Reset file input
    const input = document.getElementById('thumbnail') as HTMLInputElement;
    if (input) {
      input.value = '';
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

      this.creatorCourseService.uploadVideo(file).subscribe({
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

    // Determine if course is free
    const isFree =
      formValue.is_free !== undefined
        ? formValue.is_free
        : !formValue.is_premium;

    // Ensure price is always a valid non-negative integer
    // If course is free or price is null/undefined, set to 0
    let price = formValue.price;
    if (isFree || price === null || price === undefined || isNaN(price)) {
      price = 0;
    }
    price = Math.max(0, Math.floor(Number(price))); // Ensure non-negative integer

    // Prepare course data (instructor_id will be set automatically by CreatorCourseService)
    const courseData: any = {
      title: formValue.title,
      description: formValue.description,
      category_id: formValue.category_id,
      level: formValue.level,
      duration: formValue.duration || 0,
      price: price,
      original_price: formValue.original_price || price || 0,
      discount: formValue.discount || 0,
      is_premium: formValue.is_premium || false,
      is_free: isFree,
      status: formValue.status,
      thumbnail: formValue.thumbnail || '',
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
        ? this.creatorCourseService.updateCourse(this.course.id, courseData)
        : this.creatorCourseService.createCourse(courseData);

    operation.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loading = false;
          if (this.isEdit) {
            this.notificationService.success(
              'Thành công',
              'Khóa học đã được cập nhật thành công'
            );
            this.courseUpdated.emit(response.data);
          } else {
            this.notificationService.success(
              'Thành công',
              'Khóa học đã được tạo thành công'
            );
            this.courseCreated.emit(response.data);
          }
        } else {
          this.loading = false;
          this.error = response.message || 'Failed to save course';
          this.notificationService.error('Lỗi', this.error || undefined);
        }
      },
      error: (error) => {
        this.error =
          error.error?.message || error.message || 'Failed to save course';
        this.loading = false;
        this.notificationService.error('Lỗi', this.error || undefined);
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

