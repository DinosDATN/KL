import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CreatorCourseService } from '../../../core/services/creator-course.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

interface CourseStudent {
  id: number;
  user_id: number;
  course_id: number;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  start_date?: string;
  completion_date?: string;
  rating?: number;
  enrollment_type: 'free' | 'paid' | 'gifted';
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  } | null;
}

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-students.component.html',
  styleUrls: ['./course-students.component.css']
})
export class CourseStudentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  courseId: number = 0;
  courseTitle: string = '';
  students: CourseStudent[] = [];
  loading = false;
  
  // Filters and search
  searchTerm = '';
  selectedStatus: string = 'all';
  sortBy: 'name' | 'progress' | 'enrolled_at' = 'enrolled_at';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creatorCourseService: CreatorCourseService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.courseId = +params['id'];
      this.loadCourseInfo();
      this.loadStudents();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourseInfo(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/courses/${this.courseId}`, {
      withCredentials: true
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.success) {
          this.courseTitle = response.data.title;
        }
      },
      error: () => {
        this.notificationService.error('Lỗi', 'Không thể tải thông tin khóa học');
      }
    });
  }

  loadStudents(): void {
    this.loading = true;
    this.creatorCourseService.getCourseStudents(
      this.courseId,
      this.currentPage,
      this.itemsPerPage,
      this.searchTerm,
      this.selectedStatus !== 'all' ? this.selectedStatus : ''
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.students = response.data || [];
          this.totalItems = response.pagination.total_items;
          this.totalPages = response.pagination.total_pages;
          this.applySorting();
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Lỗi', 'Không thể tải danh sách học viên');
      }
    });
  }

  applySorting(): void {
    this.students.sort((a, b) => {
      let comparison = 0;
      switch (this.sortBy) {
        case 'name':
          const nameA = a.user?.name || '';
          const nameB = b.user?.name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'enrolled_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  onSortChange(): void {
    this.applySorting();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.sortBy = 'enrolled_at';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.loadStudents();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || this.selectedStatus !== 'all';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadStudents();
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'not-started': 'Chưa bắt đầu',
      'in-progress': 'Đang học',
      'completed': 'Hoàn thành'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'not-started': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getEnrollmentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'free': 'Miễn phí',
      'paid': 'Trả phí',
      'gifted': 'Tặng'
    };
    return labels[type] || type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  goBack(): void {
    this.router.navigate(['/creator/courses']);
  }

  // Expose Math to template
  Math = Math;
}

