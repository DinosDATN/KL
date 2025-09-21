import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Problem, TestCase, StarterCode, ProblemExample } from '../../../core/models/problem.model';
import { ProblemsService } from '../../../core/services/problems.service';
import { ProblemDescriptionComponent } from './components/problem-description/problem-description.component';
import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import { TestCasesComponent } from './components/test-cases/test-cases.component';
import { ExecutionResultsComponent } from './components/execution-results/execution-results.component';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [
    CommonModule,
    ProblemDescriptionComponent,
    CodeEditorComponent,
    TestCasesComponent,
    ExecutionResultsComponent
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
  
  // Layout state
  isMobileView = false;
  activeTab: 'description' | 'test-cases' = 'description';
  
  constructor(
    private route: ActivatedRoute,
    private problemsService: ProblemsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    this.checkMobileView();
    this.loadProblem();
    
    // Listen for window resize only in browser
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', () => this.checkMobileView());
    }
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
  
  setActiveTab(tab: 'description' | 'test-cases'): void {
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
    if (!this.problem) return '';
    
    // Use the problems service to get category name
    this.problemsService.getCategoryById(this.problem.category_id).subscribe({
      next: (category) => {
        // This will be handled reactively, but for now return a default
      }
    });
    
    // For now, provide category mapping based on category_id
    const categoryMap: { [key: number]: string } = {
      1: 'Array',
      2: 'String', 
      3: 'Linked List',
      4: 'Tree',
      5: 'Dynamic Programming'
    };
    
    return categoryMap[this.problem?.category_id || 1] || 'Unknown';
  }
  
  getProblemTagNames(): string[] {
    if (!this.problem) return [];
    return this.problemsService.getTagNamesByProblemId(this.problem.id);
  }
}
