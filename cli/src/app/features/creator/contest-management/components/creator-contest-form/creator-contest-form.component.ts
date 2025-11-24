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
import { Contest, CreateContestRequest } from '../../../../../core/models/contest.model';
import { ContestService } from '../../../../../core/services/contest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ProblemsService } from '../../../../../core/services/problems.service';
import { Problem } from '../../../../../core/models/problem.model';

@Component({
  selector: 'app-creator-contest-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './creator-contest-form.component.html',
  styleUrl: './creator-contest-form.component.css',
})
export class CreatorContestFormComponent implements OnInit, OnChanges {
  @Input() contest: Contest | null = null;
  @Input() isEdit = false;
  @Output() contestCreated = new EventEmitter<Contest>();
  @Output() contestUpdated = new EventEmitter<Contest>();
  @Output() close = new EventEmitter<void>();

  contestForm: FormGroup;
  loading = false;
  error: string | null = null;
  availableProblems: Problem[] = [];
  selectedProblems: Array<{ id: number; score: number }> = [];
  loadingProblems = false;
  searchProblemTerm = '';
  filteredProblems: Problem[] = [];

  constructor(
    private fb: FormBuilder,
    private contestService: ContestService,
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
        this.filteredProblems = problems;
        this.loadingProblems = false;
      },
      error: (error) => {
        this.loadingProblems = false;
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contest'] && this.contest && this.isEdit && this.contestForm) {
      this.populateForm(this.contest);
    }
  }

  private populateForm(contest: Contest): void {
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
    if (contest.ContestProblems && contest.ContestProblems.length > 0) {
      this.selectedProblems = contest.ContestProblems.map(cp => ({
        id: cp.problem_id,
        score: cp.score || 100
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

    // Validate datetime fields exist
    if (!formValue.start_time) {
      this.error = 'Thời gian bắt đầu là bắt buộc';
      this.loading = false;
      this.notificationService.error('Lỗi', this.error);
      return;
    }

    if (!formValue.end_time) {
      this.error = 'Thời gian kết thúc là bắt buộc';
      this.loading = false;
      this.notificationService.error('Lỗi', this.error);
      return;
    }

    // Convert datetime-local format to ISO string
    let startTime: string;
    let endTime: string;
    
    try {
      const startDate = new Date(formValue.start_time);
      const endDate = new Date(formValue.end_time);

      // Check if dates are valid
      if (isNaN(startDate.getTime())) {
        this.error = 'Định dạng thời gian bắt đầu không hợp lệ';
        this.loading = false;
        this.notificationService.error('Lỗi', this.error);
        return;
      }

      if (isNaN(endDate.getTime())) {
        this.error = 'Định dạng thời gian kết thúc không hợp lệ';
        this.loading = false;
        this.notificationService.error('Lỗi', this.error);
        return;
      }

      // Check that start time is in the future
      const now = new Date();
      if (startDate <= now) {
        this.error = 'Thời gian bắt đầu phải trong tương lai';
        this.loading = false;
        this.notificationService.error('Lỗi', this.error);
        return;
      }

      // Validate that end time is after start time
      if (endDate <= startDate) {
        this.error = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        this.loading = false;
        this.notificationService.error('Lỗi', this.error);
        return;
      }

      startTime = startDate.toISOString();
      endTime = endDate.toISOString();
    } catch (error) {
      this.error = 'Lỗi xử lý ngày/giờ. Vui lòng kiểm tra định dạng.';
      this.loading = false;
      this.notificationService.error('Lỗi', this.error);
      return;
    }

    const contestData: CreateContestRequest = {
      title: formValue.title?.trim() || '',
      description: formValue.description?.trim() || '',
      start_time: startTime,
      end_time: endTime,
    };

    // Validate required fields
    if (!contestData.title) {
      this.error = 'Tiêu đề là bắt buộc';
      this.loading = false;
      this.notificationService.error('Lỗi', this.error);
      return;
    }

    // Add problem_ids if creating new contest and problems are selected
    if (!this.isEdit && this.selectedProblems.length > 0) {
      contestData.problem_ids = this.selectedProblems.map((p) => ({
        id: typeof p.id === 'number' ? p.id : parseInt(String(p.id)),
        score: typeof p.score === 'number' ? (p.score || 100) : parseInt(String(p.score || 100))
      }));
    }

    const operation = this.isEdit && this.contest
      ? this.contestService.updateContest(this.contest.id, contestData)
      : this.contestService.createContest(contestData);

    operation.subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          if (this.isEdit) {
            this.notificationService.success(
              'Thành công',
              'Cuộc thi đã được cập nhật thành công'
            );
            this.contestUpdated.emit(response.data);
          } else {
            this.notificationService.success(
              'Thành công',
              'Cuộc thi đã được tạo thành công'
            );
            this.contestCreated.emit(response.data);
          }
        } else {
          this.error = response.message || 'Không thể lưu cuộc thi';
          this.notificationService.error('Lỗi', this.error);
        }
      },
      error: (error) => {
        // Extract detailed error message
        let errorMessage = 'Không thể lưu cuộc thi';
        if (error.error) {
          if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.errors && Array.isArray(error.error.errors)) {
            errorMessage = error.error.errors
              .map((e: any) => e.msg || e.message)
              .join(', ');
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.error = errorMessage;
        this.loading = false;
        this.notificationService.error('Lỗi', errorMessage);
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
      if (field.errors['required']) {
        return fieldName === 'title' ? 'Tiêu đề là bắt buộc' : `${fieldName} là bắt buộc`;
      }
      if (field.errors['maxlength']) return `${fieldName} quá dài`;
    }
    return null;
  }

  onProblemToggle(problemId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      if (!this.selectedProblems.find(p => p.id === problemId)) {
        this.selectedProblems.push({ id: problemId, score: 100 });
      }
    } else {
      this.selectedProblems = this.selectedProblems.filter(p => p.id !== problemId);
    }
  }

  toggleProblemSelection(problemId: number): void {
    const isSelected = this.isProblemSelected(problemId);
    if (isSelected) {
      this.selectedProblems = this.selectedProblems.filter(p => p.id !== problemId);
    } else {
      if (!this.selectedProblems.find(p => p.id === problemId)) {
        this.selectedProblems.push({ id: problemId, score: 100 });
      }
    }
  }

  isProblemSelected(problemId: number): boolean {
    return this.selectedProblems.some(p => p.id === problemId);
  }

  updateProblemPoints(problemId: number, score: number): void {
    const problem = this.selectedProblems.find(p => p.id === problemId);
    if (problem) {
      problem.score = score;
    }
  }

  getProblemPoints(problemId: number): number {
    const problem = this.selectedProblems.find(p => p.id === problemId);
    return problem?.score || 100;
  }

  onSearchChange(value: string): void {
    this.searchProblemTerm = value;
    this.updateFilteredProblems();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchProblemTerm = target.value;
    this.updateFilteredProblems();
  }

  private updateFilteredProblems(): void {
    if (!this.searchProblemTerm || this.searchProblemTerm.trim() === '') {
      this.filteredProblems = this.availableProblems;
      return;
    }
    const term = this.searchProblemTerm.toLowerCase().trim();
    this.filteredProblems = this.availableProblems.filter(p =>
      p.title?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.id.toString().includes(term)
    );
  }

  getFilteredProblems(): Problem[] {
    return this.filteredProblems;
  }

  getProblemTitle(problemId: number): string {
    const problem = this.availableProblems.find(p => p.id === problemId);
    return problem?.title || `Bài tập #${problemId}`;
  }

  removeSelectedProblem(problemId: number): void {
    this.selectedProblems = this.selectedProblems.filter(p => p.id !== problemId);
  }
}

