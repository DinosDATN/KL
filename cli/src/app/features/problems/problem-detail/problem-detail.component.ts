import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Problem, TestCase, StarterCode, ProblemExample } from '../../../core/models/problem.model';
import { ProblemsService } from '../../../core/services/problems.service';
import { ProblemDescriptionComponent } from './components/problem-description/problem-description.component';
import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import { ExamplesComponent } from './components/examples/examples.component';
import { ExecutionResultsComponent } from './components/execution-results/execution-results.component';
import { ReviewsComponent } from './components/reviews/reviews.component';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProblemDescriptionComponent,
    CodeEditorComponent,
    ExamplesComponent,
    ExecutionResultsComponent,
    ReviewsComponent
  ],
  templateUrl: './problem-detail.component.html',
  styleUrl: './problem-detail.component.css'
})
export class ProblemDetailComponent implements OnInit, OnDestroy {
  problem: Problem | null = null;
  testCases: TestCase[] = [];
  examples: ProblemExample[] = [];
  starterCodes: StarterCode[] = [];
  loading = true;
  error: string | null = null;
  
  // Category and Tags from API
  categoryName: string = '';
  tagNames: string[] = [];
  
  // Contest context
  contestId: number | null = null;
  contestProblemId: number | null = null;
  isContestMode = false;
  
  // Layout state
  isMobileView = false;
  activeTab: 'description' | 'examples' | 'comments' = 'description';
  
  constructor(
    private route: ActivatedRoute,
    private problemsService: ProblemsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    this.checkMobileView();
    this.checkContestMode();
    this.loadProblem();
    
    // Listen for window resize only in browser
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', () => this.checkMobileView());
    }
  }
  
  private checkContestMode(): void {
    // Check if this problem is being solved in contest mode
    this.route.queryParams.subscribe(params => {
      if (params['contest_id'] && params['contest_problem_id']) {
        this.contestId = parseInt(params['contest_id']);
        this.contestProblemId = parseInt(params['contest_problem_id']);
        this.isContestMode = true;
      }
    });
  }
  
  ngOnDestroy(): void {
    // Remove event listener only in browser
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', () => this.checkMobileView());
    }
  }
  
  private loadProblem(): void {
    const problemId = this.route.snapshot.paramMap.get('id');
    
    if (!problemId) {
      this.error = 'Problem ID not found';
      this.loading = false;
      return;
    }
    
    // Load problem data
    this.problemsService.getProblemById(parseInt(problemId)).subscribe({
      next: (problem: Problem | null) => {
        if (!problem) {
          this.error = 'Problem not found';
          this.loading = false;
          return;
        }
        this.problem = problem;
        
        // Extract category and tags from API response
        this.categoryName = problem.Category?.name || '';
        this.tagNames = problem.Tags?.map(tag => tag.name) || [];
        
        // If category not in response, try to load it
        if (!this.categoryName && problem.category_id) {
          this.problemsService.getCategoryById(problem.category_id).subscribe({
            next: (category) => {
              if (category) {
                this.categoryName = category.name;
              }
            }
          });
        }
        
        // If tags not in response, try to load them
        if (this.tagNames.length === 0) {
          this.problemsService.getProblemTags(problem.id).subscribe({
            next: (tags) => {
              this.tagNames = tags.map(tag => tag.name);
            }
          });
        }
        
        // Load related data
        this.loadTestCases(problem.id);
        this.loadExamples(problem.id);
        this.loadStarterCodes(problem.id);
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading problem:', error);
        this.error = 'Failed to load problem';
        this.loading = false;
      }
    });
  }
  
  private checkMobileView(): void {
    // Only check window size in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth < 1024; // lg breakpoint
    } else {
      // Default to desktop view for SSR
      this.isMobileView = false;
    }
  }
  
  setActiveTab(tab: 'description' | 'examples' | 'comments'): void {
    this.activeTab = tab;
  }
  
  private loadTestCases(problemId: number): void {
    this.testCases = this.problemsService.getTestCasesByProblemId(problemId);
  }
  
  private loadExamples(problemId: number): void {
    this.problemsService.getProblemExamples(problemId).subscribe({
      next: (examples: ProblemExample[]) => {
        this.examples = examples;
      },
      error: (error: any) => {
        console.error('Error loading examples:', error);
        this.examples = [];
      }
    });
  }
  
  private loadStarterCodes(problemId: number): void {
    this.problemsService.getStarterCodes(problemId).subscribe({
      next: (codes: StarterCode[]) => {
        this.starterCodes = codes;
      },
      error: (error: any) => {
        console.error('Error loading starter codes:', error);
        this.starterCodes = [];
      }
    });
  }
  
  getCategoryName(): string {
    return this.categoryName || 'Unknown';
  }
  
  getProblemTagNames(): string[] {
    return this.tagNames;
  }
}
