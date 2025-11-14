import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseFilters } from '../../../../../core/services/admin-course.service';

@Component({
  selector: 'app-course-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-filters.component.html',
  styleUrl: './course-filters.component.css',
})
export class CourseFiltersComponent implements OnInit {
  @Input() filters: CourseFilters = {};
  @Input() showDeletedOptions = false;
  @Output() filtersChange = new EventEmitter<CourseFilters>();

  localFilters: CourseFilters = {};

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ];

  levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  premiumOptions = [
    { value: '', label: 'All Types' },
    { value: 'true', label: 'Premium Only' },
    { value: 'false', label: 'Free Only' },
  ];

  priceRangeOptions = [
    { value: '', label: 'All Prices' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
    { value: 'discounted', label: 'Discounted' },
    { value: 'under-500k', label: 'Under 500K' },
    { value: '500k-1m', label: '500K - 1M' },
    { value: 'over-1m', label: 'Over 1M' },
  ];

  sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'title', label: 'Title' },
    { value: 'rating', label: 'Rating' },
    { value: 'students', label: 'Students' },
    { value: 'price', label: 'Price' },
  ];

  ngOnInit(): void {
    this.localFilters = { ...this.filters };
  }

  onFilterChange(): void {
    this.filtersChange.emit(this.localFilters);
  }

  onReset(): void {
    this.localFilters = {
      page: 1,
      limit: this.localFilters.limit || 10,
    };
    this.filtersChange.emit(this.localFilters);
  }

  hasActiveFilters(): boolean {
    const { page, limit, ...otherFilters } = this.localFilters;
    return Object.values(otherFilters).some(
      (value) => value !== '' && value !== null && value !== undefined
    );
  }

  getTypeLabel(isPremium: any): string {
    if (isPremium === true || isPremium === 'true') {
      return 'Premium';
    }
    return 'Free';
  }
}
