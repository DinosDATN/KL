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
  AdminDocument,
  AdminService,
} from '../../../../../core/services/admin.service';
import { DocumentService } from '../../../../../core/services/document.service';
import { Topic } from '../../../../../core/models/document.model';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-form.component.html',
  styleUrl: './document-form.component.scss',
})
export class DocumentFormComponent implements OnInit, OnChanges {
  @Input() document: AdminDocument | null = null;
  @Input() isEdit = false;
  @Output() documentCreated = new EventEmitter<AdminDocument>();
  @Output() documentUpdated = new EventEmitter<AdminDocument>();
  @Output() close = new EventEmitter<void>();

  documentForm: FormGroup;
  loading = false;
  error: string | null = null;
  topics: Topic[] = [];
  loadingTopics = false;
  showModulesSection = false;
  uploadingThumbnail = false;
  thumbnailPreview: string | null = null;

  levels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private documentService: DocumentService,
    private notificationService: NotificationService
  ) {
    this.documentForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadTopics();

    if (this.document && this.isEdit) {
      this.populateForm(this.document);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document'] && this.document && this.isEdit && this.documentForm) {
      this.populateForm(this.document);
    }
  }

  private populateForm(document: AdminDocument): void {
    this.documentForm.patchValue({
      title: document.title || '',
      description: document.description || '',
      content: document.content || '',
      topic_id: document.topic_id || null,
      level: document.level || 'Beginner',
      duration: document.duration || 0,
      thumbnail_url: document.thumbnail_url || '',
    });

    if (document.thumbnail_url) {
      this.thumbnailPreview = document.thumbnail_url;
    }
  }

  loadTopics(): void {
    this.loadingTopics = true;
    this.documentService.getTopics().subscribe({
      next: (topics) => {
        this.topics = topics;
        this.loadingTopics = false;
      },
      error: (error) => {
        console.error('Failed to load topics:', error);
        this.loadingTopics = false;
      },
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      content: [''],
      topic_id: [null, Validators.required],
      level: ['Beginner', Validators.required],
      duration: [0, [Validators.min(0)]],
      thumbnail_url: [''],
      modules: this.fb.array([]),
    });
  }

  get modulesFormArray(): FormArray {
    return this.documentForm.get('modules') as FormArray;
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
      code_example: [''],
      position: [lessonsArray.length + 1],
    });
    lessonsArray.push(lessonForm);
  }

  removeLesson(moduleIndex: number, lessonIndex: number): void {
    const lessonsArray = this.getModuleLessons(moduleIndex);
    lessonsArray.removeAt(lessonIndex);
    lessonsArray.controls.forEach((control, i) => {
      control.patchValue({ position: i + 1 });
    });
  }

  toggleModulesSection(): void {
    this.showModulesSection = !this.showModulesSection;
  }

  onSubmit(): void {
    if (this.documentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.documentForm.value;

    // Prepare document data
    const documentData: any = {
      title: formValue.title,
      description: formValue.description,
      content: formValue.content,
      topic_id: formValue.topic_id,
      level: formValue.level,
      duration: formValue.duration,
      thumbnail_url: formValue.thumbnail_url,
    };

    // Add modules and lessons if provided
    if (formValue.modules && formValue.modules.length > 0) {
      documentData.modules = formValue.modules.map((module: any) => ({
        title: module.title,
        position: module.position,
        lessons: module.lessons
          ? module.lessons.map((lesson: any) => ({
              title: lesson.title,
              content: lesson.content,
              code_example: lesson.code_example,
              position: lesson.position,
            }))
          : [],
      }));
    }

    if (this.isEdit && this.document) {
      // Update existing document
      this.adminService.updateDocument(this.document.id, documentData).subscribe({
        next: (response) => {
          if (response) {
            this.loading = false;
            this.notificationService.success(
              'Thành công',
              'Tài liệu đã được cập nhật thành công'
            );
            this.documentUpdated.emit(response);
          } else {
            this.loading = false;
            this.error = 'Failed to update document';
            this.notificationService.error('Lỗi', this.error || undefined);
          }
        },
        error: (error) => {
          this.error =
            error.error?.message || error.message || 'Failed to update document';
          this.loading = false;
          this.notificationService.error('Lỗi', this.error || undefined);
        },
      });
    } else {
      // Create new document
      this.adminService.createDocument(documentData).subscribe({
        next: (response) => {
          if (response && response.id) {
            // If modules and lessons are provided, create them after document is created
            if (formValue.modules && formValue.modules.length > 0) {
              this.createModulesAndLessons(response.id, formValue.modules);
            } else {
              this.loading = false;
              this.notificationService.success(
                'Thành công',
                'Tài liệu đã được tạo thành công'
              );
              this.documentCreated.emit(response);
            }
          } else {
            this.loading = false;
            this.error = 'Failed to create document';
            this.notificationService.error('Lỗi', this.error || undefined);
          }
        },
        error: (error) => {
          this.error =
            error.error?.message || error.message || 'Failed to create document';
          this.loading = false;
          this.notificationService.error('Lỗi', this.error || undefined);
        },
      });
    }
  }

  private createModulesAndLessons(documentId: number, modules: any[]): void {
    // This would need to be implemented with API calls to create modules and lessons
    // For now, we'll just emit the document created event
    // TODO: Implement module and lesson creation via API
    this.loading = false;
    this.notificationService.success(
      'Thành công',
      'Tài liệu đã được tạo thành công. Vui lòng thêm modules và lessons sau.'
    );
    this.documentCreated.emit({ id: documentId } as AdminDocument);
  }

  onClose(): void {
    this.close.emit();
  }

  onCancel(): void {
    this.close.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.documentForm.controls).forEach((key) => {
      this.documentForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.documentForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return null;
  }
}

