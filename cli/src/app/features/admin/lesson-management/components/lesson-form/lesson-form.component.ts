import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminLessonService, AdminLesson } from '../../../../../core/services/admin-lesson.service';
import { AdminCourseService, AdminCourse } from '../../../../../core/services/admin-course.service';
import { CoursesService } from '../../../../../core/services/courses.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { CourseModule } from '../../../../../core/models/course-module.model';

@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lesson-form.component.html',
  styleUrl: './lesson-form.component.scss',
})
export class LessonFormComponent implements OnInit {
  @Input() lesson: AdminLesson | null = null;
  @Input() isEdit = false;
  @Output() lessonCreated = new EventEmitter<AdminLesson>();
  @Output() lessonUpdated = new EventEmitter<AdminLesson>();
  @Output() close = new EventEmitter<void>();

  lessonForm: FormGroup;
  loading = false;
  error: string | null = null;
  courses: AdminCourse[] = [];
  modules: CourseModule[] = [];
  loadingModules = false;
  selectedCourseId: number | null = null;
  selectedCourse: AdminCourse | null = null;

  constructor(
    private fb: FormBuilder,
    private adminLessonService: AdminLessonService,
    private adminCourseService: AdminCourseService,
    private coursesService: CoursesService,
    private notificationService: NotificationService
  ) {
    this.lessonForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCourses();

    if (this.lesson && this.isEdit) {
      this.lessonForm.patchValue({
        module_id: this.lesson.module_id,
        title: this.lesson.title,
        content: this.lesson.content || '',
        duration: this.lesson.duration || null,
        position: this.lesson.position || null,
        type: this.lesson.type || 'document',
      });

      // Load modules for the lesson's course
      if (this.lesson.Module?.Course?.id) {
        this.selectedCourseId = this.lesson.Module.Course.id;
        // Find the full course from the courses list after it's loaded
        // We'll set it in loadCourses callback or after courses are loaded
        this.loadModules(this.lesson.Module.Course.id);
      }
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      module_id: [null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      content: [''],
      duration: [null, [Validators.min(0)]],
      position: [null, [Validators.min(1)]],
      type: ['document', Validators.required],
    });
  }

  loadCourses(): void {
    this.adminCourseService.getCourses({ limit: 1000, page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.courses = response.data;
          // If editing and we have a course ID, find and set the selected course
          if (this.lesson && this.isEdit && this.lesson.Module?.Course?.id) {
            this.selectedCourse = this.courses.find(c => c.id === this.lesson!.Module!.Course!.id) || null;
          }
        }
      },
      error: (error) => {
        console.error('Failed to load courses:', error);
      },
    });
  }

  onCourseChange(): void {
    this.selectedCourse = this.courses.find(c => c.id === this.selectedCourseId) || null;
    this.modules = [];
    this.lessonForm.patchValue({ module_id: null });

    if (this.selectedCourseId) {
      this.loadModules(this.selectedCourseId);
    }
  }

  loadModules(courseId: number): void {
    this.loadingModules = true;
    this.coursesService.getCourseModules(courseId).subscribe({
      next: (modules) => {
        this.modules = modules;
        this.loadingModules = false;
      },
      error: (error) => {
        console.error('Failed to load modules:', error);
        this.loadingModules = false;
        this.notificationService.error('Error', 'Failed to load modules');
      },
    });
  }

  onSubmit(): void {
    if (this.lessonForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.lessonForm.value;
    const lessonData: Partial<AdminLesson> = {
      module_id: formValue.module_id,
      title: formValue.title,
      content: formValue.content || null,
      duration: formValue.duration || null,
      position: formValue.position || null,
      type: formValue.type || 'document',
    };

    const operation = this.isEdit && this.lesson
      ? this.adminLessonService.updateLesson(this.lesson.id, lessonData)
      : this.adminLessonService.createLesson(lessonData);

    operation.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loading = false;
          if (this.isEdit) {
            this.notificationService.success(
              'Thành công',
              'Lesson đã được cập nhật thành công'
            );
            this.lessonUpdated.emit(response.data);
          } else {
            this.notificationService.success(
              'Thành công',
              'Lesson đã được tạo thành công'
            );
            this.lessonCreated.emit(response.data);
          }
        } else {
          this.loading = false;
          this.error = response.message || 'Failed to save lesson';
          this.notificationService.error('Lỗi', this.error || undefined);
        }
      },
      error: (error) => {
        this.error =
          error.error?.message || error.message || 'Failed to save lesson';
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
    Object.keys(this.lessonForm.controls).forEach((key) => {
      this.lessonForm.get(key)?.markAsTouched();
    });
  }
}

