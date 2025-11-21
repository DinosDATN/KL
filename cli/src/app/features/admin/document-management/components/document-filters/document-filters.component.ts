import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentFilters } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-document-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-filters.component.html',
  styleUrl: './document-filters.component.css',
})
export class DocumentFiltersComponent implements OnInit {
  @Input() filters: DocumentFilters = {};
  @Input() showDeletedOptions = false;
  @Output() filtersChange = new EventEmitter<DocumentFilters>();

  localFilters: DocumentFilters = {
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    level: '',
    topic_id: undefined,
    created_by: undefined,
    students_range: undefined,
  };

  levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  studentsRangeOptions = [
    { value: undefined, label: 'All Ranges' },
    { value: 'low', label: 'Low (< 100)' },
    { value: 'medium', label: 'Medium (100-500)' },
    { value: 'high', label: 'High (> 500)' },
  ];

  sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'title', label: 'Title' },
    { value: 'rating', label: 'Rating' },
    { value: 'students', label: 'Students' },
  ];

  ngOnInit(): void {
    // Initialize with default values and merge with input filters
    this.localFilters = {
      page: 1,
      limit: 10,
      sortBy: 'created_at',
      level: '',
      topic_id: undefined,
      created_by: undefined,
      students_range: undefined,
      ...this.filters
    };
  }

  onFilterChange(): void {
    this.filtersChange.emit(this.localFilters);
  }

  onReset(): void {
    // Reset all filters to default values
    this.localFilters = {
      page: 1,
      limit: this.localFilters.limit || 10,
      sortBy: 'created_at',
      level: '',
      topic_id: undefined,
      created_by: undefined,
      students_range: undefined,
    };
    this.filtersChange.emit(this.localFilters);
  }

  hasActiveFilters(): boolean {
    const { page, limit, sortBy, ...otherFilters } = this.localFilters;
    return Object.values(otherFilters).some(
      (value) => value !== '' && value !== null && value !== undefined
    );
  }
}

