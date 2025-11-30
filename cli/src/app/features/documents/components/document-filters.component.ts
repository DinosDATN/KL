import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentCategory, Topic } from '../../../core/models/document.model';

export interface DocumentFilters {
  searchTerm: string;
  selectedCategory: number | null;
  selectedTopic: number | null;
  selectedLevel: string;
  sortBy: string;
}

@Component({
  selector: 'app-document-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-filters.component.html',
  styleUrl: './document-filters.component.css'
})
export class DocumentFiltersComponent {
  @Input() categories: DocumentCategory[] = [];
  @Input() topics: Topic[] = [];
  @Input() filters: DocumentFilters = {
    searchTerm: '',
    selectedCategory: null,
    selectedTopic: null,
    selectedLevel: '',
    sortBy: 'title'
  };
  
  @Output() filtersChange = new EventEmitter<DocumentFilters>();
  @Output() clearFilters = new EventEmitter<void>();
  
  // Collapsible sections state
  expandedSections: { [key: string]: boolean } = {
    topic: false,
    category: false,
    level: false,
    sort: false
  };
  
  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }
  
  getSelectedTopicName(): string {
    if (!this.filters.selectedTopic) return 'Tất cả';
    const topic = this.topics.find(t => t.id === this.filters.selectedTopic);
    return topic ? topic.name : 'Tất cả';
  }
  
  getSelectedCategoryName(): string {
    if (!this.filters.selectedCategory) return 'Tất cả';
    const category = this.categories.find(c => c.id === this.filters.selectedCategory);
    return category ? category.name : 'Tất cả';
  }
  
  getSelectedLevelName(): string {
    const levelMap: { [key: string]: string } = {
      '': 'Tất cả',
      'Beginner': 'Cơ bản',
      'Intermediate': 'Trung cấp',
      'Advanced': 'Nâng cao'
    };
    return levelMap[this.filters.selectedLevel] || 'Tất cả';
  }
  
  getSortByName(): string {
    const sortMap: { [key: string]: string } = {
      'title': 'Tên tài liệu',
      'rating': 'Đánh giá cao nhất',
      'students': 'Lượt đọc nhiều nhất',
      'duration': 'Thời gian đọc',
      'created_at': 'Mới nhất'
    };
    return sortMap[this.filters.sortBy] || 'Tên tài liệu';
  }
  
  onFilterChange(): void {
    // Normalize filter values to ensure correct types
    const normalizedFilters: DocumentFilters = {
      ...this.filters,
      selectedTopic: this.filters.selectedTopic !== null && this.filters.selectedTopic !== undefined 
        ? Number(this.filters.selectedTopic) 
        : null,
      selectedCategory: this.filters.selectedCategory !== null && this.filters.selectedCategory !== undefined 
        ? Number(this.filters.selectedCategory) 
        : null
    };
    this.filtersChange.emit(normalizedFilters);
  }
  
  onClearFilters(): void {
    this.filters = {
      searchTerm: '',
      selectedCategory: null,
      selectedTopic: null,
      selectedLevel: '',
      sortBy: 'title'
    };
    this.clearFilters.emit();
    this.onFilterChange();
  }
}
