import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseCategory } from '../../../../core/models/course.model';

export interface CourseFilters {
  searchTerm: string;
  selectedCategory: number | null;
  selectedLevel: string;
  selectedPriceRange: string;
  sortBy: string;
}

@Component({
  selector: 'app-course-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-filters.component.html',
  styleUrl: './course-filters.component.css'
})
export class CourseFiltersComponent {
  @Input() categories: CourseCategory[] = [];
  @Input() filters: CourseFilters = {
    searchTerm: '',
    selectedCategory: null,
    selectedLevel: '',
    selectedPriceRange: '',
    sortBy: 'title'
  };
  
  @Output() filtersChange = new EventEmitter<CourseFilters>();
  @Output() clearFilters = new EventEmitter<void>();
  
  onFilterChange(): void {
    this.filtersChange.emit({ ...this.filters });
  }
  
  onClearFilters(): void {
    this.clearFilters.emit();
  }
}
