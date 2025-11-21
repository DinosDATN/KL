import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDocument } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnChanges {
  @Input() documents: AdminDocument[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() selectedDocumentIds: number[] = [];
  @Input() set showDeletedActions(value: boolean) {
    this._showDeletedActions = value;
  }
  get showDeletedActions(): boolean {
    return this._showDeletedActions;
  }
  private _showDeletedActions = false;
  
  @Input() sortBy: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Input() currentPage = 1;
  @Input() itemsPerPage = 10;
  @Input() totalItems = 0;
  @Input() totalPages = 1;

  @Output() documentToggle = new EventEmitter<{
    documentId: number;
    selected: boolean;
  }>();
  @Output() selectAll = new EventEmitter<boolean>();
  @Output() viewDocument = new EventEmitter<AdminDocument>();
  @Output() editDocument = new EventEmitter<AdminDocument>();
  @Output() editContent = new EventEmitter<AdminDocument>();
  @Output() deleteDocument = new EventEmitter<number>();
  @Output() restoreDocument = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{
    sortBy: string;
    order: 'asc' | 'desc';
  }>();
  @Output() pageChange = new EventEmitter<number>();

  // Expose Math for template
  Math = Math;

  selectAllChecked = false;

  onSelectAll(): void {
    this.selectAllChecked = !this.selectAllChecked;
    this.selectAll.emit(this.selectAllChecked);
  }

  onDocumentToggle(documentId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.documentToggle.emit({ documentId, selected: target.checked });
  }

  updateSelectAllState(): void {
    this.selectAllChecked =
      this.documents.length > 0 &&
      this.documents.every((d) => this.selectedDocumentIds.includes(d.id));
  }

  isDocumentSelected(documentId: number): boolean {
    return this.selectedDocumentIds.includes(documentId);
  }

  onSort(field: string): void {
    const newOrder =
      this.sortBy === field && this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ sortBy: field, order: newOrder });
  }

  onView(document: AdminDocument): void {
    this.viewDocument.emit(document);
  }

  onEdit(document: AdminDocument): void {
    this.editDocument.emit(document);
  }

  onEditContent(document: AdminDocument): void {
    this.editContent.emit(document);
  }

  onRestore(documentId: number): void {
    this.restoreDocument.emit(documentId);
  }

  onDelete(documentId: number): void {
    this.deleteDocument.emit(documentId);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
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

  getLevelColor(level: string): string {
    const colors = {
      Beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documents'] || changes['selectedDocumentIds']) {
      this.updateSelectAllState();
    }
  }
}

