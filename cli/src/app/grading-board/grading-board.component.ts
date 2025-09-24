import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SubmissionService, SubmissionFilters, PaginatedSubmissions, SubmissionStats } from '../core/services/submission.service';
import { AuthService } from '../core/services/auth.service';
import { SubmissionListComponent } from './components/submission-list/submission-list.component';
import { SubmissionDetailsComponent } from './components/submission-details/submission-details.component';

@Component({
  selector: 'app-grading-board',
  standalone: true,
  imports: [CommonModule, FormsModule, SubmissionListComponent, SubmissionDetailsComponent],
  templateUrl: './grading-board.component.html',
  styleUrl: './grading-board.component.css'
})
export class GradingBoardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  submissions: PaginatedSubmissions | null = null;
  stats: SubmissionStats | null = null;
  selectedSubmissionId: number | null = null;
  loading = false;
  currentUser: any = null;

  // Filter properties
  filters: SubmissionFilters = {
    page: 1,
    limit: 20,
    sort_by: 'submitted_at',
    sort_order: 'DESC'
  };

  // Filter form properties
  statusOptions = ['pending', 'accepted', 'wrong', 'error', 'timeout'];
  languageOptions = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'typescript', 'go', 'rust', 'php'];
  sortOptions = [
    { value: 'submitted_at', label: 'Submission Date' },
    { value: 'status', label: 'Status' },
    { value: 'language', label: 'Language' },
    { value: 'score', label: 'Score' },
    { value: 'exec_time', label: 'Execution Time' }
  ];

  // View state
  showFilters = false;
  showStats = false;
  view: 'list' | 'details' = 'list';

  constructor(
    private submissionService: SubmissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
    });

    // Load initial data
    this.loadSubmissions();
    this.loadStats();

    // Subscribe to submission updates
    this.submissionService.submissions$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(submissions => {
      this.submissions = submissions;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading methods
  loadSubmissions(): void {
    this.loading = true;
    this.submissionService.getSubmissions(this.filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.submissions = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading submissions:', error);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.submissionService.getSubmissionStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  // Filter methods
  applyFilters(): void {
    this.filters.page = 1; // Reset to first page when filtering
    this.loadSubmissions();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 20,
      sort_by: 'submitted_at',
      sort_order: 'DESC'
    };
    this.loadSubmissions();
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadSubmissions();
  }

  onPageSizeChange(size: number): void {
    this.filters.limit = size;
    this.filters.page = 1;
    this.loadSubmissions();
  }

  // Sorting methods
  onSortChange(): void {
    this.loadSubmissions();
  }

  // View methods
  onSubmissionSelect(submissionId: number): void {
    this.selectedSubmissionId = submissionId;
    this.view = 'details';
  }

  onBackToList(): void {
    this.selectedSubmissionId = null;
    this.view = 'list';
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleStats(): void {
    this.showStats = !this.showStats;
  }

  // Utility methods
  canViewAllSubmissions(): boolean {
    return this.currentUser?.role === 'admin';
  }

  getLanguageDisplayName(language: string): string {
    return this.submissionService.getLanguageDisplayName(language);
  }

  getStatusColorClass(status: string): string {
    return this.submissionService.getStatusColorClass(status);
  }
}
