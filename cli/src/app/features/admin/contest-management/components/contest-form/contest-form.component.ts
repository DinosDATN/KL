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
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  AdminContest,
  AdminService,
  AdminProblem,
} from '../../../../../core/services/admin.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ProblemsService } from '../../../../../core/services/problems.service';
import { Problem } from '../../../../../core/models/problem.model';

@Component({
  selector: 'app-contest-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './contest-form.component.html',
  styleUrl: './contest-form.component.css',
})
export class ContestFormComponent implements OnInit, OnChanges {
  @Input() contest: AdminContest | null = null;
  @Input() isEdit = false;
  @Output() contestCreated = new EventEmitter<AdminContest>();
  @Output() contestUpdated = new EventEmitter<AdminContest>();
  @Output() close = new EventEmitter<void>();

  contestForm: FormGroup;
  loading = false;
  error: string | null = null;
  availableProblems: Problem[] = [];
  selectedProblems: Array<{ id: number; points: number }> = [];
  loadingProblems = false;
  searchProblemTerm = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private problemsService: ProblemsService
  ) {
    this.contestForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadProblems();
    if (this.contest && this.isEdit) {
      this.populateForm(this.contest);
    }
  }

  loadProblems(): void {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contest'] && this.contest && this.isEdit && this.contestForm) {
      this.populateForm(this.contest);
    }
  }

  private populateForm(contest: AdminContest): void {
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    
    // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    this.contestForm.patchValue({
      title: contest.title || '',
      description: contest.description || '',
      start_time: formatDateTime(startTime),
      end_time: formatDateTime(endTime),
    });

    // Populate selected problems if contest has problems
    if (contest.Problems && contest.Problems.length > 0) {
      this.selectedProblems = contest.Problems.map(p => ({
        id: p.id,
        points: p.ContestProblem?.score || 100
      }));
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.contestForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.contestForm.value;

    // Convert datetime-local format to ISO string
    const startTime = new Date(formValue.start_time).toISOString();
    const endTime = new Date(formValue.end_time).toISOString();

    // Validate that end time is after start time
    if (new Date(endTime) <= new Date(startTime)) {
      this.error = 'End time must be after start time';
      this.loading = false;
      this.notificationService.error('Lỗi', this.error);
      return;
    }

    const contestData: any = {
      title: formValue.title,
      description: formValue.description,
      start_time: startTime,
      end_time: endTime,
    };

    // Add problem_ids if creating new contest and problems are selected
    if (!this.isEdit && this.selectedProblems.length > 0) {
      contestData.problem_ids = this.selectedProblems;
    }

    const operation = this.isEdit && this.contest
      ? this.adminService.updateContest(this.contest.id, contestData)
      : this.adminService.createContest(contestData);

    operation.subscribe({
      next: (response) => {
        this.loading = false;
        if (this.isEdit) {
          this.notificationService.success(
            'Thành công',
            'Cuộc thi đã được cập nhật thành công'
          );
          this.contestUpdated.emit(response);
        } else {
          this.notificationService.success(
            'Thành công',
            'Cuộc thi đã được tạo thành công'
          );
          this.contestCreated.emit(response);
        }
      },
      error: (error) => {
        this.error =
          error.error?.message || error.message || 'Failed to save contest';
        this.loading = false;
        this.notificationService.error('Lỗi', this.error || undefined);
      },
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onCancel(): void {
    this.close.emit();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contestForm.controls).forEach((key) => {
      this.contestForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.contestForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
    }
    return null;
  }

  onProblemToggle(problemId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      if (!this.selectedProblems.find(p => p.id === problemId)) {
        this.selectedProblems.push({ id: problemId, points: 100 });
      }
    } else {
      this.selectedProblems = this.selectedProblems.filter(p => p.id !== problemId);
    }
  }

  isProblemSelected(problemId: number): boolean {
    return this.selectedProblems.some(p => p.id === problemId);
  }

  updateProblemPoints(problemId: number, points: number): void {
    const problem = this.selectedProblems.find(p => p.id === problemId);
    if (problem) {
      problem.points = points;
    }
  }

  getProblemPoints(problemId: number): number {
    const problem = this.selectedProblems.find(p => p.id === problemId);
    return problem?.points || 100;
  }

  getFilteredProblems(): Problem[] {
    if (!this.searchProblemTerm) {
      return this.availableProblems;
    }
    const term = this.searchProblemTerm.toLowerCase();
    return this.availableProblems.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    );
  }

  getProblemTitle(problemId: number): string {
    const problem = this.availableProblems.find(p => p.id === problemId);
    return problem?.title || `Problem #${problemId}`;
  }

  removeSelectedProblem(problemId: number): void {
    this.selectedProblems = this.selectedProblems.filter(p => p.id !== problemId);
  }
}

