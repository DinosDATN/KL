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
  
  onFilterChange(): void {
    this.filtersChange.emit({ ...this.filters });
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
