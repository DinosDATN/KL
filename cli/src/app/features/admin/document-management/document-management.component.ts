import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AdminDocument,
  DocumentFilters,
  DocumentStats,
  AdminService,
} from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { BaseAdminComponent } from '../base-admin.component';
import { ThemeService } from '../../../core/services/theme.service';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { DocumentFiltersComponent } from './components/document-filters/document-filters.component';
import { DocumentStatsComponent } from './components/document-stats/document-stats.component';
import { BulkActionsComponent } from '../course-management/components/bulk-actions/bulk-actions.component';
import { DocumentFormComponent } from './components/document-form/document-form.component';

@Component({
  selector: 'app-document-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    DocumentListComponent,
    DocumentFiltersComponent,
    DocumentStatsComponent,
    BulkActionsComponent,
    DocumentFormComponent
  ],
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.css']
})
export class DocumentManagementComponent extends BaseAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  documents: AdminDocument[] = [];
  stats: DocumentStats | null = null;
  selectedDocuments: number[] = [];
  loading = false;
  error: string | null = null;

  // UI State
  activeTab: 'all' | 'deleted' | 'create' = 'all';
  showBulkActions = false;
  isFormModalOpen = false;
  editingDocument: AdminDocument | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;

  // Filters
  filters: DocumentFilters = {
    page: 1,
    limit: 10,
    sortBy: 'created_at',
  };

  searchTerm = '';
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Form data
  formData: {
    title: string;
    description: string;
    content: string;
    topic_id: number | null;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: number | null;
    thumbnail_url: string;
  } = {
    title: '',
    description: '',
    content: '',
    topic_id: null,
    level: 'Beginner',
    duration: null,
    thumbnail_url: ''
  };

  // Topics list (would be loaded from API)
  topics: Array<{ id: number; name: string }> = [];

  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    authService: AuthService,
    router: Router,
    public themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(platformId, authService, router);
  }

  ngOnInit(): void {
    this.runInBrowser(() => {
      if (this.checkAdminAccess()) {
        this.loadInitialData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loadDocuments();
    this.loadStats();
    // TODO: Load topics from API
  }

  loadDocuments(): void {
    if (!this.isBrowser) {
      return;
    }

    this.loading = true;
    this.error = null;

    const filtersWithDeletedFlag: DocumentFilters = {
      ...this.filters,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };

    const service = this.activeTab === 'deleted'
      ? this.adminService.getDeletedDocuments(filtersWithDeletedFlag)
      : this.adminService.getDocuments(filtersWithDeletedFlag);

    service
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          console.log('Documents response:', response);
          this.documents = response.documents || [];
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.total_pages;
          this.totalItems = response.pagination.total_items;
          this.itemsPerPage = response.pagination.items_per_page;
          console.log('Documents loaded:', this.documents.length);
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.error = error.message || 'Failed to load documents';
          this.notificationService.error('Error', this.error || 'Failed to load documents');
        }
      });
  }

  loadStats(): void {
    if (!this.isBrowser) {
      return;
    }

    this.adminService.getDocumentStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          if (error.status === 401) {
            this.notificationService.error('Session expired', 'Please login again.');
            this.router.navigate(['/auth/login']);
          }
        }
      });
  }

  onTabChange(tab: 'all' | 'deleted' | 'create'): void {
    if (tab === 'create') {
      this.openCreateModal();
      return;
    }

    this.activeTab = tab;
    this.selectedDocuments = [];
    this.showBulkActions = false;
    this.currentPage = 1;
    
    this.filters = {
      ...this.filters,
      page: 1,
      is_deleted: tab === 'deleted' ? true : false,
    };
    
    this.loadDocuments();
  }

  onFiltersChange(newFilters: DocumentFilters): void {
    this.filters = { 
      ...this.filters, 
      ...newFilters, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.loadDocuments();
  }

  onSearch(): void {
    this.filters = { 
      ...this.filters, 
      search: this.searchTerm, 
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.loadDocuments();
  }

  onSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }

    this.filters = {
      ...this.filters,
      sortBy: `${sortBy}_${this.sortOrder}`,
      page: 1,
    };
    this.currentPage = 1;
    this.loadDocuments();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.filters = {
      ...this.filters,
      page: page,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.loadDocuments();
  }

  onSelectDocument(documentId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedDocuments.push(documentId);
    } else {
      this.selectedDocuments = this.selectedDocuments.filter(id => id !== documentId);
    }
    this.showBulkActions = this.selectedDocuments.length > 0;
  }

  onSelectAll(selectAll: boolean): void {
    if (selectAll) {
      this.selectedDocuments = this.documents.map((d) => d.id);
    } else {
      this.selectedDocuments = [];
    }
    this.showBulkActions = this.selectedDocuments.length > 0;
  }

  onDocumentToggle(event: { documentId: number; selected: boolean }): void {
    if (event.selected) {
      this.selectedDocuments = [...this.selectedDocuments, event.documentId];
    } else {
      this.selectedDocuments = this.selectedDocuments.filter(
        (id) => id !== event.documentId
      );
    }
    this.showBulkActions = this.selectedDocuments.length > 0;
  }

  onDocumentSelect(documentIds: number[]): void {
    this.selectedDocuments = documentIds;
    this.showBulkActions = documentIds.length > 0;
  }

  onBulkAction(action: string): void {
    if (this.selectedDocuments.length === 0) return;

    switch (action) {
      case 'delete':
        this.onBulkDelete();
        break;
      case 'restore':
        this.onBulkRestore();
        break;
    }
  }

  onViewDocument(document: AdminDocument): void {
    // Navigate to document detail page
    this.router.navigate(['/documents', document.id]);
  }

  onEditContent(document: AdminDocument): void {
    // Navigate to document lesson management page with document filter
    // Use the same pattern as course management - navigate with array
    console.log('onEditContent - Document ID:', document.id);
    
    // First try: Use router.navigate with array (same as course management)
    this.router.navigate(['/admin/document-lessons'], {
      queryParams: { documentId: document.id }
    }).then(
      (success) => {
        if (success) {
          console.log('✅ Navigation successful using router.navigate');
        } else {
          console.warn('⚠️ Navigation returned false, trying navigateByUrl...');
          this.tryNavigateByUrl(document.id);
        }
      },
      (error) => {
        console.error('❌ router.navigate failed:', error);
        this.tryNavigateByUrl(document.id);
      }
    );
  }

  private tryNavigateByUrl(documentId: number): void {
    const url = `/admin/document-lessons?documentId=${documentId}`;
    console.log('Trying navigateByUrl to:', url);
    
    this.router.navigateByUrl(url).then(
      (success) => {
        if (success) {
          console.log('✅ navigateByUrl successful');
        } else {
          console.error('❌ navigateByUrl returned false');
          this.notificationService.error(
            'Navigation Error',
            'Cannot navigate to document lessons page. Please check the browser console for details.'
          );
        }
      },
      (error) => {
        console.error('❌ navigateByUrl failed:', error);
        this.notificationService.error(
          'Navigation Error',
          `Failed to navigate: ${error.message || 'Unknown error'}. Please check if the route '/admin/document-lessons' exists.`
        );
      }
    );
  }

  onSortChange(event: { sortBy: string; order: 'asc' | 'desc' }): void {
    this.sortBy = event.sortBy;
    this.sortOrder = event.order;

    this.filters = {
      ...this.filters,
      sortBy: `${event.sortBy}_${event.order}`,
      page: 1,
      is_deleted: this.activeTab === 'deleted' ? true : false
    };
    this.currentPage = 1;
    this.loadDocuments();
  }

  onDocumentCreated(document: AdminDocument): void {
    console.log('Document created successfully!');
    this.closeFormModal();
    this.loadDocuments();
    this.loadStats();
  }

  onDocumentUpdated(document: AdminDocument): void {
    console.log('Document updated successfully!');
    this.closeFormModal();
    this.loadDocuments();
    this.loadStats();
  }

  openEditModal(document: AdminDocument): void {
    // Load full document details from API to ensure we have the latest data
    this.loading = true;
    this.adminService.getDocumentById(document.id).subscribe({
      next: (response) => {
        if (response) {
          this.editingDocument = response;
          this.isFormModalOpen = true;
        } else {
          this.notificationService.error('Error', 'Failed to load document details');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading document:', error);
        // Fallback to using the document data we already have
        this.editingDocument = document;
        this.isFormModalOpen = true;
        this.loading = false;
        this.notificationService.warning('Warning', 'Using cached document data. Some information may be outdated.');
      },
    });
  }

  openCreateModal(): void {
    this.editingDocument = null;
    this.formData = {
      title: '',
      description: '',
      content: '',
      topic_id: null,
      level: 'Beginner',
      duration: null,
      thumbnail_url: ''
    };
    this.isFormModalOpen = true;
  }


  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.editingDocument = null;
  }

  saveDocument(): void {
    if (!this.formData.title || !this.formData.topic_id) {
      this.notificationService.error('Validation Error', 'Title and Topic are required');
      return;
    }

    const documentData = {
      title: this.formData.title,
      description: this.formData.description || undefined,
      content: this.formData.content || undefined,
      topic_id: this.formData.topic_id!,
      level: this.formData.level,
      duration: this.formData.duration ?? undefined,
      thumbnail_url: this.formData.thumbnail_url || undefined
    };

    const operation = this.editingDocument
      ? this.adminService.updateDocument(this.editingDocument.id, documentData)
      : this.adminService.createDocument(documentData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Success',
            `Document ${this.editingDocument ? 'updated' : 'created'} successfully`
          );
          this.closeFormModal();
          this.loadDocuments();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error saving document:', error);
          this.notificationService.error(
            'Error',
            error.message || `Failed to ${this.editingDocument ? 'update' : 'create'} document`
          );
        }
      });
  }

  deleteDocument(documentId: number): void {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    this.adminService.deleteDocument(documentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Document deleted successfully');
          this.loadDocuments();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          this.notificationService.error('Error', error.message || 'Failed to delete document');
        }
      });
  }

  restoreDocument(documentId: number): void {
    if (!confirm('Are you sure you want to restore this document?')) {
      return;
    }

    this.adminService.restoreDocument(documentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Document restored successfully');
          if (this.activeTab === 'deleted') {
            this.activeTab = 'all';
            this.filters = {
              ...this.filters,
              is_deleted: false,
              page: 1
            };
            this.currentPage = 1;
          }
          this.loadDocuments();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error restoring document:', error);
          this.notificationService.error('Error', error.message || 'Failed to restore document');
        }
      });
  }

  permanentlyDeleteDocument(documentId: number): void {
    if (!confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) {
      return;
    }

    this.adminService.permanentlyDeleteDocument(documentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Success', 'Document permanently deleted');
          this.loadDocuments();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error permanently deleting document:', error);
          this.notificationService.error('Error', error.message || 'Failed to permanently delete document');
        }
      });
  }

  onBulkDelete(): void {
    if (this.selectedDocuments.length === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to delete ${this.selectedDocuments.length} document(s)?`)) {
      return;
    }

    this.adminService.bulkDeleteDocuments(this.selectedDocuments, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Success', `${response.deletedCount} document(s) deleted successfully`);
          this.selectedDocuments = [];
          this.showBulkActions = false;
          this.loadDocuments();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error bulk deleting documents:', error);
          this.notificationService.error('Error', error.message || 'Failed to delete documents');
        }
      });
  }

  onBulkRestore(): void {
    if (this.selectedDocuments.length === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to restore ${this.selectedDocuments.length} document(s)?`)) {
      return;
    }

    this.adminService.bulkRestoreDocuments(this.selectedDocuments)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Success', `${response.restoredCount} document(s) restored successfully`);
          this.selectedDocuments = [];
          this.showBulkActions = false;
          if (this.activeTab === 'deleted') {
            this.activeTab = 'all';
            this.filters = {
              ...this.filters,
              is_deleted: false,
              page: 1
            };
            this.currentPage = 1;
          }
          this.loadDocuments();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error bulk restoring documents:', error);
          this.notificationService.error('Error', error.message || 'Failed to restore documents');
        }
      });
  }

  onExport(format: 'json' | 'csv'): void {
    this.adminService.exportDocuments(format, this.activeTab === 'deleted')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `documents-${Date.now()}.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.success('Success', `Documents exported as ${format.toUpperCase()}`);
        },
        error: (error) => {
          console.error('Error exporting documents:', error);
          this.notificationService.error('Error', error.message || 'Failed to export documents');
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatNumber(value: unknown): string {
    const num = Number(value);
    if (isNaN(num) || num === null || num === undefined) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
