import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  Problem, 
  ProblemCategory, 
  Tag,
  ProblemTag 
} from '../../core/models/problem.model';
import { ProblemsService } from '../../core/services/problems.service';
import { ThemeService } from '../../core/services/theme.service';
import { ProblemCardComponent } from './components/problem-card/problem-card.component';
import { ProblemTableComponent } from './components/problem-table/problem-table.component';
import { ProblemFiltersComponent, ProblemFilters } from './components/problem-filters/problem-filters.component';
import { ProblemsBannerComponent } from './components/problems-banner/problems-banner.component';

export type ViewMode = 'card' | 'table';

@Component({
  selector: 'app-problems',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ProblemCardComponent,
    ProblemTableComponent,
    ProblemFiltersComponent, 
    ProblemsBannerComponent
  ],
  templateUrl: './problems.component.html',
  styleUrl: './problems.component.css'
})
export class ProblemsComponent implements OnInit {
  problems: Problem[] = [];
  filteredProblems: Problem[] = [];
  categories: ProblemCategory[] = [];
  tags: Tag[] = [];
  problemTags: ProblemTag[] = [];
  
  // Search term for top search bar
  topSearchTerm: string = '';
  
  // Filter and search properties
  filters: ProblemFilters = {
    searchTerm: '',
    selectedCategory: null,
    selectedDifficulty: '',
    selectedTags: [],
    sortBy: 'title',
    showNew: false,
    showPopular: false,
    showPremium: false
  };
  
  // View mode
  viewMode: ViewMode = 'card';
  
  // Pagination with Load More
  currentLoadCount: number = 6;
  itemsPerLoad: number = 6;
  
  // Loading state
  loading: boolean = false;
  loadingMore: boolean = false;
  
  // Mobile filter state
  mobileFiltersOpen: boolean = false;
  
  // Expose Math to template
  Math = Math;
  
  constructor(
    public themeService: ThemeService,
    private router: Router,
    private problemsService: ProblemsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    // Only load data in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }
  
  private loadData(): void {
    this.loading = true;
    
    // Use the problems service instead of direct mock data
    this.problemsService.getProblems().subscribe({
      next: (problems) => {
        this.problems = problems.filter(problem => !problem.is_deleted);
        this.loadCategories();
        this.loadTags();
      },
      error: (error) => {
        console.error('Error loading problems:', error);
        this.loading = false;
      }
    });
  }
  
  private loadCategories(): void {
    this.problemsService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadProblemTags();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }
  
  private loadTags(): void {
    this.problemsService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
      }
    });
  }
  
  private loadProblemTags(): void {
    // For now, we'll create problem tags based on the service's getTagNamesByProblemId method
    // In a real app, this would come from the API
    this.problemTags = [];
    this.problems.forEach(problem => {
      const tagNames = this.problemsService.getTagNamesByProblemId(problem.id);
      tagNames.forEach(tagName => {
        const tag = this.tags.find(t => t.name === tagName);
        if (tag) {
          this.problemTags.push({ problem_id: problem.id, tag_id: tag.id });
        }
      });
    });
    
    this.applyFilters();
    this.loading = false;
  }
  
  onTopSearchChange(): void {
    this.filters.searchTerm = this.topSearchTerm;
    this.currentLoadCount = this.itemsPerLoad; // Reset pagination
    this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.problems];
    
    // Enhanced search filter - search across multiple fields
    if (this.filters.searchTerm.trim()) {
      const term = this.filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(problem => {
        // Get category name for search
        const categoryName = this.getCategoryName(problem.category_id).toLowerCase();
        // Get tag names for search
        const tagNames = this.getProblemTagNames(problem.id).map(name => name.toLowerCase());
        
        return problem.title.toLowerCase().includes(term) ||
               (problem.description && problem.description.toLowerCase().includes(term)) ||
               categoryName.includes(term) ||
               tagNames.some(name => name.includes(term)) ||
               problem.difficulty.toLowerCase().includes(term);
      });
    }
    
    // Category filter
    if (this.filters.selectedCategory !== null) {
      filtered = filtered.filter(problem => problem.category_id === this.filters.selectedCategory);
    }
    
    // Difficulty filter
    if (this.filters.selectedDifficulty) {
      filtered = filtered.filter(problem => problem.difficulty === this.filters.selectedDifficulty);
    }
    
    // Tags filter
    if (this.filters.selectedTags.length > 0) {
      filtered = filtered.filter(problem => {
        const problemTagIds = this.problemTags
          .filter(pt => pt.problem_id === problem.id)
          .map(pt => pt.tag_id);
        return this.filters.selectedTags.some(tagId => problemTagIds.includes(tagId));
      });
    }
    
    // Special filters
    if (this.filters.showNew) {
      filtered = filtered.filter(problem => problem.is_new);
    }
    
    if (this.filters.showPopular) {
      filtered = filtered.filter(problem => problem.is_popular);
    }
    
    if (this.filters.showPremium) {
      filtered = filtered.filter(problem => problem.is_premium);
    }
    
    // Sort
    filtered = this.sortProblems(filtered, this.filters.sortBy);
    
    this.filteredProblems = filtered;
  }
  
  private sortProblems(problems: Problem[], sortBy: string): Problem[] {
    return problems.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'acceptance':
          return b.acceptance - a.acceptance;
        case 'popularity':
          return b.likes - a.likes;
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }
  
  get displayedProblems(): Problem[] {
    return this.filteredProblems.slice(0, this.currentLoadCount);
  }
  
  get hasMoreProblems(): boolean {
    return this.currentLoadCount < this.filteredProblems.length;
  }
  
  onFiltersChange(newFilters: ProblemFilters): void {
    this.filters = { ...newFilters };
    this.topSearchTerm = this.filters.searchTerm;
    this.currentLoadCount = this.itemsPerLoad; // Reset pagination
    this.applyFilters();
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
    this.topSearchTerm = '';
    this.currentLoadCount = this.itemsPerLoad;
    this.applyFilters();
  }
  
  loadMoreProblems(): void {
    this.loadingMore = true;
    
    // Simulate loading delay
    setTimeout(() => {
      this.currentLoadCount += this.itemsPerLoad;
      this.loadingMore = false;
    }, 300);
  }
  
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'card' ? 'table' : 'card';
  }
  
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }
  
  getProblemTagNames(problemId: number): string[] {
    const tagIds = this.problemTags
      .filter(pt => pt.problem_id === problemId)
      .map(pt => pt.tag_id);
    
    return tagIds.map(id => {
      const tag = this.tags.find(t => t.id === id);
      return tag ? tag.name : 'Unknown Tag';
    });
  }
  
  onProblemView(problem: Problem): void {
    // Navigate to problem detail page
    this.router.navigate(['/problems', problem.id]);
  }
  
  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }
  
  closeMobileFilters(): void {
    this.mobileFiltersOpen = false;
  }
  
  trackByProblemId(index: number, problem: Problem): number {
    return problem.id;
  }
  
  // Top search methods
  clearTopSearch(): void {
    this.topSearchTerm = '';
    this.filters.searchTerm = '';
    this.currentLoadCount = this.itemsPerLoad;
    this.applyFilters();
  }
}
