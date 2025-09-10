import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Course, CourseCategory } from '../../../core/models/course.model';
import { User } from '../../../core/models/user.model';
import { mockCourses, mockCourseCategories, mockInstructors } from '../../../core/services/courses-mock-data';
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
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
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
  
  // Loading state
  loading: boolean = false;
  
  // Mobile filter state
  mobileFiltersOpen: boolean = false;
  
  // Expose Math to template
  Math = Math;
  
  constructor(
    public themeService: ThemeService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  private loadData(): void {
    this.loading = true;
    
    // Simulate API call delay
    setTimeout(() => {
      this.courses = mockCourses.filter(course => course.status === 'published' && !course.is_deleted);
      this.categories = mockCourseCategories;
      this.instructors = mockInstructors;
      this.applyFilters();
      this.loading = false;
    }, 500);
  }
  
  applyFilters(): void {
    let filtered = [...this.courses];
    
    // Enhanced search filter - search across multiple fields
    if (this.filters.searchTerm.trim()) {
      const term = this.filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(course => {
        // Get instructor name for search
        const instructorName = this.getInstructorName(course.instructor_id).toLowerCase();
        // Get category name for search
        const categoryName = this.getCategoryName(course.category_id).toLowerCase();
        
        return course.title.toLowerCase().includes(term) ||
               (course.description && course.description.toLowerCase().includes(term)) ||
               instructorName.includes(term) ||
               categoryName.includes(term) ||
               course.level.toLowerCase().includes(term);
      });
    }
    
    // Category filter
    if (this.filters.selectedCategory !== null) {
      filtered = filtered.filter(course => course.category_id === this.filters.selectedCategory);
    }
    
    // Level filter
    if (this.filters.selectedLevel) {
      filtered = filtered.filter(course => course.level === this.filters.selectedLevel);
    }
    
    // Price range filter
    if (this.filters.selectedPriceRange) {
      filtered = this.filterByPriceRange(filtered, this.filters.selectedPriceRange);
    }
    
    // Sort
    filtered = this.sortCourses(filtered, this.filters.sortBy);
    
    this.filteredCourses = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    
    // Keep current page within valid range
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }
  
  private filterByPriceRange(courses: Course[], range: string): Course[] {
    switch (range) {
      case 'free':
        return courses.filter(course => course.price === 0);
      case 'paid':
        return courses.filter(course => (course.price || 0) > 0);
      case 'discounted':
        return courses.filter(course => (course.discount || 0) > 0);
      case 'under-500k':
        return courses.filter(course => (course.price || 0) > 0 && (course.price || 0) < 500000);
      case '500k-1m':
        return courses.filter(course => (course.price || 0) >= 500000 && (course.price || 0) < 1000000);
      case 'over-1m':
        return courses.filter(course => (course.price || 0) >= 1000000);
      default:
        return courses;
    }
  }
  
  private sortCourses(courses: Course[], sortBy: string): Course[] {
    return courses.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return b.rating - a.rating;
        case 'students':
          return b.students - a.students;
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'price':
          return (a.price || 0) - (b.price || 0);
        default:
          return 0;
      }
    });
  }
  
  get paginatedCourses(): Course[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCourses.slice(start, end);
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPage = newItemsPerPage;
    this.totalPages = Math.ceil(this.filteredCourses.length / this.itemsPerPage);
    this.currentPage = 1; // Reset to first page
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
