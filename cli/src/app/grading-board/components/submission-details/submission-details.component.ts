import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Submission, SubmissionService } from '../../../core/services/submission.service';

@Component({
  selector: 'app-submission-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './submission-details.component.html',
  styleUrl: './submission-details.component.css'
})
export class SubmissionDetailsComponent implements OnInit, OnChanges, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @Input() submissionId: number | null = null;
  @Input() currentUser: any = null;
  @Output() backToList = new EventEmitter<void>();

  submission: Submission | null = null;
  loading = false;
  error: string | null = null;
  showCode = false;
  codeLoading = false;

  constructor(private submissionService: SubmissionService) {}

  ngOnInit(): void {
    this.loadSubmissionDetails();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['submissionId'] && changes['submissionId'].currentValue) {
      this.loadSubmissionDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubmissionDetails(): void {
    if (!this.submissionId) return;

    this.loading = true;
    this.error = null;
    this.showCode = false;

    this.submissionService.getSubmissionById(this.submissionId, false).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (submission) => {
        this.submission = submission;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load submission details';
        this.loading = false;
        console.error('Error loading submission details:', error);
      }
    });
  }

  loadSubmissionCode(): void {
    if (!this.submissionId || !this.canViewCode()) return;

    this.codeLoading = true;
    this.submissionService.getSubmissionById(this.submissionId, true).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (submission) => {
        this.submission = submission;
        this.showCode = true;
        this.codeLoading = false;
      },
      error: (error) => {
        console.error('Error loading submission code:', error);
        this.codeLoading = false;
      }
    });
  }

  onBackClick(): void {
    this.backToList.emit();
  }

  onToggleCode(): void {
    if (!this.showCode && this.canViewCode()) {
      this.loadSubmissionCode();
    } else {
      this.showCode = !this.showCode;
    }
  }

  canViewCode(): boolean {
    if (!this.submission || !this.currentUser) return false;
    return this.submissionService.canViewCode(this.submission, this.currentUser.id) || this.currentUser.role === 'admin';
  }

  getStatusColorClass(status: string): string {
    return this.submissionService.getStatusColorClass(status);
  }

  getDifficultyColorClass(difficulty: string): string {
    return this.submissionService.getDifficultyColorClass(difficulty);
  }

  getLanguageDisplayName(language: string): string {
    return this.submissionService.getLanguageDisplayName(language);
  }

  formatExecutionTime(execTime?: number): string {
    return this.submissionService.formatExecutionTime(execTime);
  }

  formatMemoryUsage(memoryUsed?: number): string {
    return this.submissionService.formatMemoryUsage(memoryUsed);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'wrong': 'Wrong Answer',
      'error': 'Runtime Error',
      'timeout': 'Time Limit Exceeded'
    };
    return statusMap[status] || status;
  }

  copyCodeToClipboard(): void {
    if (this.submission?.Code?.source_code) {
      navigator.clipboard.writeText(this.submission.Code.source_code).then(() => {
        // Could show a toast notification here
        console.log('Code copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy code: ', err);
      });
    }
  }

  getCodeLanguageForHighlighting(): string {
    if (!this.submission) return 'text';
    
    const languageMap: { [key: string]: string } = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'php': 'php'
    };
    
    return languageMap[this.submission.language] || 'text';
  }
}
