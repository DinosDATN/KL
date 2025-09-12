// ...existing code...
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  Document,
  DocumentModule,
  DocumentLesson,
  Topic,
  DocumentCategory,
  DocumentCategoryLink,
  Animation,
} from '../../../core/models/document.model';
import { DocumentService } from '../../../core/services/document.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.css',
})
export class DocumentDetailComponent implements OnInit {
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.style.display = 'none';
    }
  }
  document: Document | null = null;
  documentModules: DocumentModule[] = [];
  documentLessons: DocumentLesson[] = [];
  topic: Topic | null = null;
  categories: DocumentCategory[] = [];
  animations: Animation[] = [];
  creator: any = null;

  // UI State
  loading: boolean = true;
  selectedModuleId: number | null = null;
  selectedLessonId: number | null = null;
  error: string | null = null;

  // Navigation
  breadcrumbs = [
    { label: 'Trang chủ', link: '/' },
    { label: 'Tài liệu', link: '/documents' },
    { label: '', link: '', active: true },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const documentId = +params['id'];
      if (documentId) {
        this.loadDocument(documentId);
      }
    });
  }

  private loadDocument(documentId: number): void {
    this.loading = true;
    this.error = null;

    // Use the getDocumentDetails API which returns all related data in one call
    this.documentService.getDocumentDetails(documentId).subscribe({
      next: (data) => {
        this.document = data.document;
        this.topic = data.topic;
        this.categories = data.categories;
        this.documentModules = data.modules.sort(
          (a, b) => a.position - b.position
        );
        this.documentLessons = data.lessons.sort(
          (a, b) => a.position - b.position
        );
        this.animations = data.animations;
        this.creator = data.creator;

        // Update breadcrumb
        this.breadcrumbs[2].label = this.document.title;

        // Auto-select first module and lesson
        this.autoSelectFirstModuleAndLesson();

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading document details:', error);
        this.error = 'Failed to load document details. Please try again.';
        this.loading = false;

        // If document not found, navigate back to documents
        if (error.message.includes('not found') || error.status === 404) {
          this.router.navigate(['/documents']);
        }
      },
    });
  }

  private autoSelectFirstModuleAndLesson(): void {
    // Auto-select first module and lesson
    if (this.documentModules.length > 0) {
      this.selectedModuleId = this.documentModules[0].id;
      const firstModuleLessons = this.documentLessons.filter(
        (l) => l.module_id === this.selectedModuleId
      );
      if (firstModuleLessons.length > 0) {
        this.selectedLessonId = firstModuleLessons[0].id;
      }
    }
  }

  onModuleSelect(moduleId: number): void {
    this.selectedModuleId = moduleId;
    const moduleLessons = this.documentLessons.filter(
      (l) => l.module_id === moduleId
    );
    if (moduleLessons.length > 0) {
      this.selectedLessonId = moduleLessons[0].id;
    } else {
      this.selectedLessonId = null;
    }
  }

  onLessonSelect(lessonId: number): void {
    this.selectedLessonId = lessonId;
  }

  getLessonsForModule(moduleId: number): DocumentLesson[] {
    return this.documentLessons.filter(
      (lesson) => lesson.module_id === moduleId
    );
  }

  getSelectedLesson(): DocumentLesson | null {
    return this.selectedLessonId
      ? this.documentLessons.find(
          (lesson) => lesson.id === this.selectedLessonId
        ) || null
      : null;
  }

  getSelectedModule(): DocumentModule | null {
    return this.selectedModuleId
      ? this.documentModules.find(
          (module) => module.id === this.selectedModuleId
        ) || null
      : null;
  }

  getLevelBadgeClass(level: string): string {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  }

  generateStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) =>
      i < Math.floor(rating) ? 1 : 0
    );
  }

  onBack(): void {
    this.router.navigate(['/documents']);
  }

  // Helper methods for template
  get topicName(): string {
    return this.topic ? this.topic.name : 'Unknown Topic';
  }

  get categoryNames(): string[] {
    return this.categories.map((cat) => cat.name);
  }

  get creatorName(): string {
    return this.creator ? this.creator.name : 'Unknown Creator';
  }

  get hasContent(): boolean {
    return (
      (Array.isArray(this.documentModules) &&
        this.documentModules.length > 0) ||
      (this.document != null &&
        this.document.content != null &&
        this.document.content !== '')
    );
  }

  get totalLessons(): number {
    return this.documentLessons.length;
  }

  get totalModules(): number {
    return this.documentModules.length;
  }
}
