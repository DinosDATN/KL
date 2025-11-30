import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProblemCategory, Tag } from '../../../../core/models/problem.model';

export interface ProblemFilters {
  searchTerm: string;
  selectedCategory: number | null;
  selectedDifficulty: string;
  selectedTags: number[];
  sortBy: string;
  showNew: boolean;
  showPopular: boolean;
  showPremium: boolean;
}

@Component({
  selector: 'app-problem-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './problem-filters.component.html',
  styleUrl: './problem-filters.component.css'
})
export class ProblemFiltersComponent {
  @Input() categories: ProblemCategory[] = [];
  @Input() tags: Tag[] = [];
  @Input() filters: ProblemFilters = {
    searchTerm: '',
    selectedCategory: null,
    selectedDifficulty: '',
    selectedTags: [],
    sortBy: 'title',
    showNew: false,
    showPopular: false,
    showPremium: false
  };
  
  @Output() filtersChange = new EventEmitter<ProblemFilters>();
  @Output() clearFilters = new EventEmitter<void>();
  
  difficulties = [
    { value: '', label: 'Tất cả độ khó' },
    { value: 'Easy', label: 'Dễ' },
    { value: 'Medium', label: 'Trung bình' },
    { value: 'Hard', label: 'Khó' }
  ];
  
  sortOptions = [
    { value: 'title', label: 'Tên bài' },
    { value: 'difficulty', label: 'Độ khó' },
    { value: 'acceptance', label: 'Tỉ lệ AC' },
    { value: 'popularity', label: 'Phổ biến' },
    { value: 'created_at', label: 'Mới nhất' }
  ];
  
  onFilterChange(): void {
    this.filtersChange.emit({ ...this.filters });
  }
  
  onTagToggle(tagId: number): void {
    // Normalize tagId to number for consistent comparison
    const normalizedTagId = Number(tagId);
    const index = this.filters.selectedTags.findIndex(id => Number(id) === normalizedTagId);
    if (index > -1) {
      this.filters.selectedTags.splice(index, 1);
    } else {
      this.filters.selectedTags.push(normalizedTagId);
    }
    this.onFilterChange();
  }
  
  isTagSelected(tagId: number): boolean {
    // Normalize both values for comparison
    const normalizedTagId = Number(tagId);
    return this.filters.selectedTags.some(id => Number(id) === normalizedTagId);
  }
  
  onClearFilters(): void {
    this.filters = {
      searchTerm: '',
      selectedCategory: null,
      selectedDifficulty: '',
      selectedTags: [],
      sortBy: 'title',
      showNew: false,
      showPopular: false,
      showPremium: false
    };
    this.clearFilters.emit();
    this.onFilterChange();
  }
  
  get hasActiveFilters(): boolean {
    return this.filters.searchTerm.trim() !== '' ||
           this.filters.selectedCategory !== null ||
           this.filters.selectedDifficulty !== '' ||
           this.filters.selectedTags.length > 0 ||
           this.filters.showNew ||
           this.filters.showPopular ||
           this.filters.showPremium;
  }
}
