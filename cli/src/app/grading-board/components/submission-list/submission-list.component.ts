import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Submission, PaginatedSubmissions } from '../../../core/services/submission.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-submission-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submission-list.component.html',
  styleUrl: './submission-list.component.css'
})
export class SubmissionListComponent implements OnInit {
  @Input() submissions: PaginatedSubmissions | null = null;
  @Input() loading = false;
  @Input() currentUser: any = null;
  
  @Output() submissionSelect = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  // Pagination options
  pageSizeOptions = [10, 20, 50, 100];
  currentPageSize = 20;

  // Make Math available in template
  Math = Math;

  constructor(
    private submissionService: SubmissionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialize component
  }

  onSubmissionClick(submission: Submission): void {
    this.submissionSelect.emit(submission.id);
  }

  onPageSizeChange(newSize: number): void {
    this.currentPageSize = newSize;
    this.pageSizeChange.emit(newSize);
  }

  onPreviousPage(): void {
    if (this.submissions && this.submissions.pagination.current_page > 1) {
      this.pageChange.emit(this.submissions.pagination.current_page - 1);
    }
  }

  onNextPage(): void {
    if (this.submissions && this.submissions.pagination.current_page < this.submissions.pagination.total_pages) {
      this.pageChange.emit(this.submissions.pagination.current_page + 1);
    }
  }

  onPageClick(page: number): void {
    this.pageChange.emit(page);
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

  canViewCode(submission: Submission): boolean {
    return this.submissionService.canViewCode(submission, this.currentUser?.id);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getVisiblePages(): number[] {
    if (!this.submissions) return [];
    
    const { current_page, total_pages } = this.submissions.pagination;
    const maxVisiblePages = 5;
    const pages: number[] = [];
    
    let startPage = Math.max(1, current_page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  hasSubmissions(): boolean {
    return !!(this.submissions && this.submissions.submissions.length > 0);
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
}
