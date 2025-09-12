import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { Course, CourseCategory } from '../../../core/models/course.model';
import { User } from '../../../core/models/user.model';
import { CoursesService } from '../../../core/services/courses.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CourseCardComponent } from '../components/course-card/course-card.component';
import { CourseFiltersComponent, CourseFilters } from '../components/course-filters/course-filters.component';
import { CoursesBannerComponent } from '../components/courses-banner/courses-banner.component';
import { CoursesPaginationComponent } from '../components/courses-pagination/courses-pagination.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, CourseCardComponent, CourseFiltersComponent, CoursesBannerComponent, CoursesPaginationComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  categories: CourseCategory[] = [];
  instructors: User[] = [];
  
  // Top search term
  topSearchTerm: string = '';
  
  // Filter and search properties
  filters: CourseFilters = {
    searchTerm: '',
    selectedCategory: null,
    selectedLevel: '',
    selectedPriceRange: '',
    sortBy: 'title'
  };
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  totalItems: number = 0;
  
  // Loading states
  loading: boolean = false;
  loadingCategories: boolean = false;
  loadingInstructors: boolean = false;
  
  // Error states
  error: string | null = null;
  categoriesError: string | null = null;
  instructorsError: string | null = null;
  
  // Mobile filter state
  mobileFiltersOpen: boolean = false;
  
  // Subscription management
  private destroy$ = new Subject<void>();
  
  // Expose Math to template
  Math = Math;
  
  constructor(
    public themeService: ThemeService,
    private router: Router,
    private coursesService: CoursesService
  ) {}
  
  ngOnInit(): void {
    this.loadInitialData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadInitialData(): void {
    // Load categories and instructors for filters
    this.loadCategories();
    this.loadInstructors();
    
    // Load courses
    this.loadCourses();
  }
  
  private loadCategories(): void {
    this.loadingCategories = true;
    this.categoriesError = null;
    
    this.coursesService.getCourseCategories()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingCategories = false)
      )
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
          this.categoriesError = error.message;
        }
      });
  }
  
  private loadInstructors(): void {
    this.loadingInstructors = true;
    this.instructorsError = null;
    
    this.coursesService.getInstructors()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingInstructors = false)
      )
      .subscribe({
        next: (instructors) => {
          this.instructors = instructors;
        },
        error: (error) => {
          console.error('Failed to load instructors:', error);
          this.instructorsError = error.message;
        }
      });
  }
  
  private loadCourses(): void {
    this.loading = true;
    this.error = null;
    
    const filters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.filters.searchTerm || undefined,
      level: this.filters.selectedLevel || undefined,
      category_id: this.filters.selectedCategory || undefined,
      priceRange: this.filters.selectedPriceRange || undefined,
      sortBy: this.filters.sortBy || undefined
    };
    
    this.coursesService.getAllCourses(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.courses = response.data;
          this.totalItems = response.pagination.total_items;
          this.totalPages = response.pagination.total_pages;
          this.currentPage = response.pagination.current_page;
        },
        error: (error) => {
          console.error('Failed to load courses:', error);
          this.error = error.message;
          this.courses = [];
        }
      });
  }
  
  applyFilters(): void {
    // Reset to first page when filters change
    this.currentPage = 1;
    this.loadCourses();
  }
  
  onFiltersChange(newFilters: CourseFilters): void {
    this.filters = { ...newFilters };
    this.topSearchTerm = this.filters.searchTerm;
    this.applyFilters();
  }
  
  onClearFilters(): void {
    this.topSearchTerm = '';
    this.filters = {
      searchTerm: '',
      selectedCategory: null,
      selectedLevel: '',
      selectedPriceRange: '',
      sortBy: 'title'
    };
    this.currentPage = 1;
    this.applyFilters();
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadCourses();
    }
  }
  
  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1; // Reset to first page
    this.loadCourses();
  }
  
  getInstructorName(instructorId: number): string {
    const instructor = this.instructors.find(i => i.id === instructorId);
    return instructor ? instructor.name : 'Unknown Instructor';
  }
  
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
  
  formatDuration(duration: number | null | undefined): string {
    if (!duration) return 'N/A';
    return duration === 1 ? '1 giờ' : `${duration} giờ`;
  }
  
  generateStarsArray(rating: number): number[] {
    return Array.from({length: 5}, (_, i) => i + 1);
  }
  
  onCourseEnroll(course: Course): void {
    // Navigate to course detail page
    this.router.navigate(['/courses', course.id]);
  }
  
  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }
  
  closeMobileFilters(): void {
    this.mobileFiltersOpen = false;
  }
  
  // Retry methods
  retryLoadCourses(): void {
    this.loadCourses();
  }
  
  retryLoadCategories(): void {
    this.loadCategories();
  }
  
  retryLoadInstructors(): void {
    this.loadInstructors();
  }
  
  // Top search methods
  onTopSearchChange(): void {
    this.filters.searchTerm = this.topSearchTerm;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }
  
  clearTopSearch(): void {
    this.topSearchTerm = '';
    this.filters.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }
}
