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
import {
  mockDocuments,
  mockDocumentModules,
  mockDocumentLessons,
  mockTopics,
  mockDocumentCategories,
  mockDocumentCategoryLinks,
  mockAnimations,
} from '../../../core/services/document-mock-data';
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
  topicName: string = '';
  categoryNames: string[] = [];
  animations: Animation[] = [];

  // UI State
  loading: boolean = true;
  selectedModuleId: number | null = null;
  selectedLessonId: number | null = null;

  // Navigation
  breadcrumbs = [
    { label: 'Trang chủ', link: '/' },
    { label: 'Tài liệu', link: '/documents' },
    { label: '', link: '', active: true },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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

    // Simulate API call delay
    setTimeout(() => {
      // Load document
      this.document =
        mockDocuments.find((doc) => doc.id === documentId && !doc.is_deleted) ||
        null;

      if (!this.document) {
        this.router.navigate(['/documents']);
        return;
      }

      // Update breadcrumb
      this.breadcrumbs[2].label = this.document.title;

      // Load related data
      this.loadRelatedData(documentId);

      this.loading = false;
    }, 500);
  }

  private loadRelatedData(documentId: number): void {
    // Load modules for this document
    this.documentModules = mockDocumentModules
      .filter((module) => module.document_id === documentId)
      .sort((a, b) => a.position - b.position);

    // Load lessons for modules
    const moduleIds = this.documentModules.map((m) => m.id);
    this.documentLessons = mockDocumentLessons
      .filter((lesson) => moduleIds.includes(lesson.module_id))
      .sort((a, b) => a.position - b.position);

    // Load topic name
    if (this.document) {
      const topic = mockTopics.find((t) => t.id === this.document!.topic_id);
      this.topicName = topic ? topic.name : 'Unknown Topic';

      // Load category names
      const categoryIds = mockDocumentCategoryLinks
        .filter((link) => link.document_id === documentId)
        .map((link) => link.category_id);

      this.categoryNames = categoryIds.map((id) => {
        const category = mockDocumentCategories.find((c) => c.id === id);
        return category ? category.name : 'Unknown Category';
      });

      // Load animations
      this.animations = mockAnimations.filter(
        (anim) => anim.document_id === documentId
      );

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
}
