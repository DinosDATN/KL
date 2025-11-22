import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContestFilters } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-contest-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contest-filters.component.html',
  styleUrl: './contest-filters.component.css',
})
export class ContestFiltersComponent implements OnInit {
  @Input() filters: ContestFilters = {};
  @Output() filtersChange = new EventEmitter<ContestFilters>();

  localFilters: ContestFilters = {
    page: 1,
    limit: 10,
    sortBy: 'start_time',
    status: undefined,
    search: undefined,
    date_range: undefined,
  };

  statusOptions = [
    { value: undefined, label: 'All Status' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  sortOptions = [
    { value: 'start_time', label: 'Start Time' },
    { value: 'end_time', label: 'End Time' },
    { value: 'title', label: 'Title' },
    { value: 'created_at', label: 'Created Date' },
  ];

  dateRangeOptions = [
    { value: undefined, label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
  ];

  ngOnInit(): void {
    this.localFilters = {
      page: 1,
      limit: 10,
      sortBy: 'start_time',
      status: undefined,
      search: undefined,
      date_range: undefined,
      ...this.filters,
    };
  }

  onFilterChange(): void {
    this.filtersChange.emit(this.localFilters);
  }

  onReset(): void {
    this.localFilters = {
      page: 1,
      limit: 10,
      sortBy: 'start_time',
      status: undefined,
      search: undefined,
      date_range: undefined,
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

