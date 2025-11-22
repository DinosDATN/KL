import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminContest, AdminService } from '../../../../../core/services/admin.service';
import { ProblemsService } from '../../../../../core/services/problems.service';
import { Problem } from '../../../../../core/models/problem.model';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-contest-problems',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contest-problems.component.html',
  styleUrl: './contest-problems.component.css',
})
export class ContestProblemsComponent implements OnInit {
  @Input() contest: AdminContest | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() problemsUpdated = new EventEmitter<void>();

  contestProblems: Array<{
    id: number;
    problem_id: number;
    points: number;
    Problem?: Problem;
  }> = [];
  availableProblems: Problem[] = [];
  loading = false;
  loadingProblems = false;
  searchTerm = '';
  showAddProblemModal = false;
  selectedProblemId: number | null = null;
  problemPoints = 100;

  constructor(
    private adminService: AdminService,
    private problemsService: ProblemsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.contest) {
      this.loadContestProblems();
      this.loadAvailableProblems();
    }
  }

  loadContestProblems(): void {
    if (!this.contest) return;

    this.loading = true;
    this.adminService.getContestById(this.contest.id).subscribe({
      next: (contest) => {
        if (contest.Problems) {
          this.contestProblems = contest.Problems.map(p => ({
            id: p.ContestProblem?.id || 0,
            problem_id: p.id,
            points: p.ContestProblem?.score || 100,
            Problem: p as any,
          }));
        }
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.error('Lỗi', 'Không thể tải danh sách bài tập');
        this.loading = false;
      },
    });
  }

  loadAvailableProblems(): void {
    this.loadingProblems = true;
    this.problemsService.getProblems().subscribe({
      next: (problems) => {
        this.availableProblems = problems;
        this.loadingProblems = false;
      },
      error: (error) => {
        console.error('Failed to load problems:', error);
        this.loadingProblems = false;
      },
    });
  }

  getFilteredProblems(): Problem[] {
    if (!this.searchTerm) {
      return this.availableProblems.filter(p => 
        !this.contestProblems.some(cp => cp.problem_id === p.id)
      );
    }
    const term = this.searchTerm.toLowerCase();
    return this.availableProblems.filter(p =>
      !this.contestProblems.some(cp => cp.problem_id === p.id) &&
      (p.title.toLowerCase().includes(term) ||
       p.description?.toLowerCase().includes(term))
    );
  }

  openAddProblemModal(): void {
    this.showAddProblemModal = true;
    this.selectedProblemId = null;
    this.problemPoints = 100;
  }

  closeAddProblemModal(): void {
    this.showAddProblemModal = false;
    this.selectedProblemId = null;
    this.problemPoints = 100;
  }

  addProblem(): void {
    if (!this.selectedProblemId || !this.contest) {
      return;
    }

    this.adminService
      .addProblemToContest(this.contest.id, this.selectedProblemId, this.problemPoints)
      .subscribe({
        next: () => {
          this.notificationService.success('Thành công', 'Đã thêm bài tập vào cuộc thi');
          this.closeAddProblemModal();
          this.loadContestProblems();
          this.problemsUpdated.emit();
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.error?.message || 'Không thể thêm bài tập'
          );
        },
      });
  }

  removeProblem(problemId: number): void {
    if (!this.contest) return;

    if (!confirm('Bạn có chắc chắn muốn xóa bài tập này khỏi cuộc thi?')) {
      return;
    }

    this.adminService.removeProblemFromContest(this.contest.id, problemId).subscribe({
      next: () => {
        this.notificationService.success('Thành công', 'Đã xóa bài tập khỏi cuộc thi');
        this.loadContestProblems();
        this.problemsUpdated.emit();
      },
      error: (error) => {
        this.notificationService.error(
          'Lỗi',
          error.error?.message || 'Không thể xóa bài tập'
        );
      },
    });
  }

  updateProblemPoints(problemId: number, points: number): void {
    // Note: This would require an API endpoint to update points
    // For now, we'll just show a message
    this.notificationService.info('Thông tin', 'Vui lòng xóa và thêm lại bài tập để thay đổi điểm số');
  }

  onClose(): void {
    this.close.emit();
  }
}

