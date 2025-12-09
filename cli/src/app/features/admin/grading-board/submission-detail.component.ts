import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { BaseAdminComponent } from '../base-admin.component';

interface SubmissionDetail {
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
    description: string;
    Category: {
      id: number;
      name: string;
    } | null;
  };
  Code?: {
    id: number;
    source_code: string;
  };
}

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './submission-detail.component.html',
  styleUrls: ['./submission-detail.component.css']
})
export class SubmissionDetailComponent extends BaseAdminComponent implements OnInit {
  submission: SubmissionDetail | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    authService: AuthService,
    router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    super(platformId, authService, router);
  }

  ngOnInit() {
    if (!this.checkAdminAccess()) {
      return;
    }

    this.runInBrowser(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadSubmissionDetail(parseInt(id));
      }
    });
  }

  loadSubmissionDetail(id: number) {
    this.loading = true;
    this.error = null;

    this.http.get<any>(`${environment.apiUrl}/submissions/${id}`, {
      params: { include_code: 'true' }
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.submission = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading submission:', err);
        this.error = 'Không thể tải chi tiết bài nộp';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/grading-board']);
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
}
