import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminContest,
  AdminService,
} from '../../../../../core/services/admin.service';
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
export class ContestProblemsComponent implements OnInit, OnChanges {
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
    console.log('ContestProblemsComponent ngOnInit, contest:', this.contest);
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ContestProblemsComponent ngOnChanges, changes:', changes);
    if (changes['contest'] && this.contest) {
      console.log('Contest changed, new contest:', this.contest);
      this.loadData();
    }
  }

  private loadData(): void {
    if (this.contest) {
      // First check if contest already has Problems
      if (
        this.contest.Problems &&
        Array.isArray(this.contest.Problems) &&
        this.contest.Problems.length > 0
      ) {
        console.log(
          'Using Problems from input contest:',
          this.contest.Problems
        );
        this.mapContestProblems(this.contest.Problems);
      } else {
        console.log('No Problems in input contest, loading from API');
        this.loadContestProblems();
      }
      this.loadAvailableProblems();
    }
  }

  private mapContestProblems(problems: any[]): void {
    this.contestProblems = problems.map((p: any) => {
      const mapped = {
        id: p.ContestProblem?.id || 0,
        problem_id: p.id,
        points: p.ContestProblem?.score || 100,
        Problem: {
          id: p.id,
          title: p.title || `Problem #${p.id}`,
          difficulty: p.difficulty || 'N/A',
          estimated_time: p.estimated_time,
          description: p.description,
        } as Problem,
      };
      console.log('Mapping problem:', p, 'to:', mapped);
      return mapped;
    });
    console.log('Final contestProblems:', this.contestProblems);
  }

  loadContestProblems(): void {
    if (!this.contest) return;

    this.loading = true;
    console.log('Loading contest problems for contest ID:', this.contest.id);
    this.adminService.getContestById(this.contest.id).subscribe({
      next: (contest) => {
        console.log('Contest data loaded from API:', contest);
        console.log('Contest.Problems:', contest.Problems);
        console.log('Is Problems array?', Array.isArray(contest.Problems));
        console.log('Problems length:', contest.Problems?.length);

        if (
          contest.Problems &&
          Array.isArray(contest.Problems) &&
          contest.Problems.length > 0
        ) {
          this.mapContestProblems(contest.Problems);
        } else {
          console.log('No problems found in contest response');
          this.contestProblems = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contest problems:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        this.notificationService.error(
          'Lỗi',
          'Không thể tải danh sách bài tập'
        );
        this.loading = false;
        this.contestProblems = [];
      },
    });
  }

  loadAvailableProblems(): void {
    this.loadingProblems = true;
    this.problemsService.getProblems().subscribe({
      next: (problems) => {
        console.log('Available problems loaded:', problems);
        this.availableProblems = problems || [];
        this.loadingProblems = false;
      },
      error: (error) => {
        console.error('Failed to load problems:', error);
        this.notificationService.error(
          'Lỗi',
          'Không thể tải danh sách bài tập có sẵn'
        );
        this.availableProblems = [];
        this.loadingProblems = false;
      },
    });
  }

  getFilteredProblems(): Problem[] {
    if (!this.searchTerm) {
      return this.availableProblems.filter(
        (p) => !this.contestProblems.some((cp) => cp.problem_id === p.id)
      );
    }
    const term = this.searchTerm.toLowerCase();
    return this.availableProblems.filter(
      (p) =>
        !this.contestProblems.some((cp) => cp.problem_id === p.id) &&
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
      .addProblemToContest(
        this.contest.id,
        this.selectedProblemId,
        this.problemPoints
      )
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Thành công',
            'Đã thêm bài tập vào cuộc thi'
          );
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

    this.adminService
      .removeProblemFromContest(this.contest.id, problemId)
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Thành công',
            'Đã xóa bài tập khỏi cuộc thi'
          );
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
    this.notificationService.info(
      'Thông tin',
      'Vui lòng xóa và thêm lại bài tập để thay đổi điểm số'
    );
  }

  onClose(): void {
    this.close.emit();
  }
}
