import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContestFilters } from '../../../../core/models/contest.model';

@Component({
  selector: 'app-contest-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contest-filters.component.html',
  styleUrl: './contest-filters.component.css'
})
export class ContestFiltersComponent {
  @Input() filters: ContestFilters = { status: 'all' };
  @Output() filtersChange = new EventEmitter<ContestFilters>();
  @Output() clearFilters = new EventEmitter<void>();

  statusOptions = [
    { value: 'all', label: 'Tất cả', icon: 'grid' },
    { value: 'active', label: 'Đang diễn ra', icon: 'play-circle', color: 'text-green-600' },
    { value: 'upcoming', label: 'Sắp tới', icon: 'clock', color: 'text-blue-600' },
    { value: 'completed', label: 'Đã kết thúc', icon: 'check-circle', color: 'text-gray-600' }
  ];

  onFilterChange(): void {
    this.filtersChange.emit(this.filters);
  }

  onClearFilters(): void {
    this.filters = { status: 'all' };
    this.clearFilters.emit();
  }

  get hasActiveFilters(): boolean {
    return (
      (this.filters.status && this.filters.status !== 'all') ||
      !!this.filters.searchTerm ||
      !!this.filters.created_by
    );
  }

  getStatusLabel(status?: string): string {
    const option = this.statusOptions.find(o => o.value === status);
    return option ? option.label : 'Tất cả';
  }

  getDisplaySearchTerm(): string {
    if (!this.filters.searchTerm) return '';
    return this.filters.searchTerm.length > 20 
      ? this.filters.searchTerm.slice(0, 20) + '...'
      : this.filters.searchTerm;
  }

  clearStatusFilter(): void {
    this.filters.status = 'all';
    this.onFilterChange();
  }

  clearSearchFilter(): void {
    this.filters.searchTerm = '';
    this.onFilterChange();
  }
}
