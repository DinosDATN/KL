import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProblemFilters, AdminService, ProblemCategory } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-problem-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './problem-filters.component.html',
  styleUrl: './problem-filters.component.css',
})
export class ProblemFiltersComponent implements OnInit, OnDestroy {
  @Input() filters: ProblemFilters = {};
  @Input() showDeletedOptions = false;
  @Output() filtersChange = new EventEmitter<ProblemFilters>();

  private destroy$ = new Subject<void>();
  categories: ProblemCategory[] = [];
  loadingCategories = false;

  localFilters: ProblemFilters = {
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    difficulty: undefined,
    category_id: undefined,
    is_premium: undefined,
    is_popular: undefined,
    is_new: undefined,
    acceptance_range: undefined,
    created_by: undefined,
  };

  difficultyOptions = [
    { value: undefined, label: 'All Difficulties' },
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' },
  ];

  acceptanceRangeOptions = [
    { value: undefined, label: 'All Ranges' },
    { value: 'low', label: 'Low (< 30%)' },
    { value: 'medium', label: 'Medium (30-70%)' },
    { value: 'high', label: 'High (> 70%)' },
  ];

  sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'acceptance', label: 'Acceptance Rate' },
    { value: 'likes', label: 'Likes' },
  ];

  premiumOptions = [
    { value: undefined, label: 'All' },
    { value: true, label: 'Premium Only' },
    { value: false, label: 'Free Only' },
  ];

  booleanOptions = [
    { value: undefined, label: 'All' },
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ];

  constructor(
    private adminService: AdminService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize with default values and merge with input filters
      this.localFilters = {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        difficulty: undefined,
        category_id: undefined,
        is_premium: undefined,
        is_popular: undefined,
        is_new: undefined,
        acceptance_range: undefined,
        created_by: undefined,
        ...this.filters
      };

      this.loadCategories();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadingCategories = true;
    this.adminService.getProblemCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          console.log('Categories loaded:', categories);
          this.categories = categories || [];
          this.loadingCategories = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          console.error('Error details:', {
            status: error?.status,
            message: error?.message,
            error: error?.error
          });
          this.categories = [];
          this.loadingCategories = false;
        }
      });
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
      difficulty: undefined,
      category_id: undefined,
      is_premium: undefined,
      is_popular: undefined,
      is_new: undefined,
      acceptance_range: undefined,
      created_by: undefined,
    };
    this.filtersChange.emit(this.localFilters);
  }

  hasActiveFilters(): boolean {
    const { page, limit, sortBy, ...otherFilters } = this.localFilters;
    return Object.values(otherFilters).some(
      (value) => value !== '' && value !== null && value !== undefined
    );
  }

  getDifficultyLabel(value: string | undefined): string {
    if (!value) return '';
    return this.difficultyOptions.find(opt => opt.value === value)?.label || value;
  }

  getCategoryName(id: number | undefined): string {
    if (!id) return '';
    const category = this.categories.find(cat => cat.id === id);
    return category?.name || `Category ${id}`;
  }
}

