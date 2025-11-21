import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseAdminComponent } from '../base-admin.component';
import { AuthService } from '../../../core/services/auth.service';
import { DocumentService } from '../../../core/services/document.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DocumentModule, DocumentLesson } from '../../../core/models/document.model';
import { AdminDocument, AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-document-lesson-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-lesson-management.component.html',
  styleUrl: './document-lesson-management.component.css'
})
export class DocumentLessonManagementComponent extends BaseAdminComponent implements OnInit {
  document: AdminDocument | null = null;
  modules: DocumentModule[] = [];
  selectedModuleId: number | null = null;
  lessons: DocumentLesson[] = [];
  loading = false;
  loadingDocument = false;
  error: string | null = null;

  // Form data for new module
  newModuleTitle = '';
  showModuleForm = false;

  // Form data for new lesson
  newLessonTitle = '';
  newLessonContent = '';
  newLessonCodeExample = '';
  showLessonForm = false;

  constructor(
    private documentService: DocumentService,
    private adminService: AdminService,
    private notificationService: NotificationService,
    authService: AuthService,
    router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
  }

  ngOnInit(): void {
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        // Check for documentId in query params
        this.route.queryParams.subscribe(params => {
          const documentId = params['documentId'];
          if (documentId) {
            this.loadDocument(Number(documentId));
          } else {
            this.error = 'Document ID is required';
            this.notificationService.error('Error', 'Document ID is required');
          }
        });
      }
    });
  }

  loadDocument(documentId: number): void {
    this.loadingDocument = true;
    this.error = null;

    this.adminService.getDocumentById(documentId).subscribe({
      next: (response) => {
        if (response) {
          this.document = response;
          this.loadModules(documentId);
        } else {
          this.error = 'Document not found';
          this.notificationService.error('Error', 'Document not found');
        }
        this.loadingDocument = false;
      },
      error: (error) => {
        console.error('Error loading document:', error);
        this.error = error.message || 'Failed to load document';
        this.notificationService.error('Error', this.error || 'Failed to load document');
        this.loadingDocument = false;
      }
    });
  }

  loadModules(documentId: number): void {
    this.loading = true;
    this.documentService.getDocumentModules(documentId).subscribe({
      next: (modules) => {
        this.modules = modules;
        if (modules.length > 0 && !this.selectedModuleId) {
          this.selectedModuleId = modules[0].id;
          this.loadLessons(this.selectedModuleId);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading modules:', error);
        this.error = error.message || 'Failed to load modules';
        this.notificationService.error('Error', this.error || 'Failed to load modules');
        this.loading = false;
      }
    });
  }

  loadLessons(moduleId: number): void {
    this.loading = true;
    this.documentService.getModuleLessons(moduleId).subscribe({
      next: (lessons) => {
        this.lessons = lessons;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading lessons:', error);
        this.error = error.message || 'Failed to load lessons';
        this.notificationService.error('Error', this.error || 'Failed to load lessons');
        this.loading = false;
      }
    });
  }

  onModuleSelect(moduleId: number): void {
    this.selectedModuleId = moduleId;
    this.loadLessons(moduleId);
  }

  createModule(): void {
    if (!this.newModuleTitle.trim() || !this.document) {
      this.notificationService.error('Error', 'Module title is required');
      return;
    }

    this.loading = true;
    const position = this.modules.length + 1;

    this.documentService.createDocumentModule(this.document.id, {
      title: this.newModuleTitle,
      position
    }).subscribe({
      next: (module) => {
        this.notificationService.success('Success', 'Module created successfully');
        this.newModuleTitle = '';
        this.showModuleForm = false;
        this.loadModules(this.document!.id);
      },
      error: (error) => {
        console.error('Error creating module:', error);
        this.notificationService.error('Error', error.message || 'Failed to create module');
        this.loading = false;
      }
    });
  }

  createLesson(): void {
    if (!this.newLessonTitle.trim() || !this.selectedModuleId) {
      this.notificationService.error('Error', 'Lesson title is required');
      return;
    }

    this.loading = true;
    const position = this.lessons.length + 1;

    this.documentService.createDocumentLesson(this.selectedModuleId, {
      title: this.newLessonTitle,
      content: this.newLessonContent,
      code_example: this.newLessonCodeExample,
      position
    }).subscribe({
      next: (lesson) => {
        this.notificationService.success('Success', 'Lesson created successfully');
        this.newLessonTitle = '';
        this.newLessonContent = '';
        this.newLessonCodeExample = '';
        this.showLessonForm = false;
        this.loadLessons(this.selectedModuleId!);
      },
      error: (error) => {
        console.error('Error creating lesson:', error);
        this.notificationService.error('Error', error.message || 'Failed to create lesson');
        this.loading = false;
      }
    });
  }

  deleteModule(moduleId: number): void {
    if (!confirm('Are you sure you want to delete this module? All lessons in this module will also be deleted.')) {
      return;
    }

    this.loading = true;
    this.documentService.deleteDocumentModule(moduleId).subscribe({
      next: () => {
        this.notificationService.success('Success', 'Module deleted successfully');
        if (this.selectedModuleId === moduleId) {
          this.selectedModuleId = null;
          this.lessons = [];
        }
        this.loadModules(this.document!.id);
      },
      error: (error) => {
        console.error('Error deleting module:', error);
        this.notificationService.error('Error', error.message || 'Failed to delete module');
        this.loading = false;
      }
    });
  }

  deleteLesson(lessonId: number): void {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    this.loading = true;
    this.documentService.deleteDocumentLesson(lessonId).subscribe({
      next: () => {
        this.notificationService.success('Success', 'Lesson deleted successfully');
        this.loadLessons(this.selectedModuleId!);
      },
      error: (error) => {
        console.error('Error deleting lesson:', error);
        this.notificationService.error('Error', error.message || 'Failed to delete lesson');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/documents']);
  }
}

