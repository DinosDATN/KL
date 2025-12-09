import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface Submission {
  id: number;
  problem_id: number;
  user_id: number;
  language: string;
  status: string;
  exec_time: number | null;
  memory_used: number | null;
  score: number;
  submitted_at: string;
  User: {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  Problem: {
    id: number;
    title: string;
    difficulty: string;
    Category: {
      id: number;
      name: string;
    } | null;
  };
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

@Component({
  selector: 'app-grading-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grading-board.component.html',
  styleUrls: ['./grading-board.component.css']
})
export class GradingBoardComponent implements OnInit {
  submissions: Submission[] = [];
  loading = false;
  error: string | null = null;
  isBrowser: boolean;

  // Filters
  filters = {
    status: '',
    language: '',
    problem_id: '',
    page: 1,
    limit: 20,
    sort_by: 'submitted_at',
    sort_order: 'DESC'
  };

  // Pagination
  pagination: PaginationInfo = {
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    per_page: 20
  };

  // Filter options
  statusOptions = ['accepted', 'wrong', 'error', 'timeout', 'pending'];
  languageOptions = ['python', 'javascript', 'java', 'cpp', 'c'];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadSubmissions();
    }
  }

  loadSubmissions() {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.filters.page.toString(),
      limit: this.filters.limit.toString(),
      sort_by: this.filters.sort_by,
      sort_order: this.filters.sort_order
    };

    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.language) params.language = this.filters.language;
    if (this.filters.problem_id) params.problem_id = this.filters.problem_id;

    this.http.get<any>(`${environment.apiUrl}/submissions`, { params })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.submissions = response.data.submissions;
            this.pagination = response.data.pagination;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading submissions:', err);
          this.error = 'Không thể tải danh sách bài nộp';
          this.loading = false;
        }
      });
  }

  applyFilters() {
    this.filters.page = 1;
    this.loadSubmissions();
  }

  resetFilters() {
    this.filters = {
      status: '',
      language: '',
      problem_id: '',
      page: 1,
      limit: 20,
      sort_by: 'submitted_at',
      sort_order: 'DESC'
    };
    this.loadSubmissions();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.pagination.total_pages) {
      this.filters.page = page;
      this.loadSubmissions();
    }
  }

  changeSort(field: string) {
    if (this.filters.sort_by === field) {
      this.filters.sort_order = this.filters.sort_order === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filters.sort_by = field;
      this.filters.sort_order = 'DESC';
    }
    this.loadSubmissions();
  }

  viewSubmissionDetails(submissionId: number) {
    this.router.navigate(['/grading-board', submissionId]);
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'accepted': 'status-accepted',
      'wrong': 'status-wrong',
      'error': 'status-error',
      'timeout': 'status-timeout',
      'pending': 'status-pending'
    };
    return statusClasses[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'accepted': 'Đúng',
      'wrong': 'Sai',
      'error': 'Lỗi',
      'timeout': 'Quá thời gian',
      'pending': 'Đang chờ'
    };
    return statusLabels[status] || status;
  }

  getDifficultyClass(difficulty: string): string {
    const difficultyClasses: { [key: string]: string } = {
      'easy': 'difficulty-easy',
      'medium': 'difficulty-medium',
      'hard': 'difficulty-hard'
    };
    return difficultyClasses[difficulty] || 'difficulty-default';
  }

  getDifficultyLabel(difficulty: string): string {
    const difficultyLabels: { [key: string]: string } = {
      'easy': 'Dễ',
      'medium': 'Trung bình',
      'hard': 'Khó'
    };
    return difficultyLabels[difficulty] || difficulty;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    const current = this.pagination.current_page;
    const total = this.pagination.total_pages;

    let start = Math.max(1, current - Math.floor(maxPages / 2));
    let end = Math.min(total, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
