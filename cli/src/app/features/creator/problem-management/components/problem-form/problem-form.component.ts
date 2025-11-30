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
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import {
  AdminProblem,
  AdminService,
  ProblemCategory,
  ProblemTag,
} from '../../../../../../core/services/admin.service';
import { NotificationService } from '../../../../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { OnDestroy } from '@angular/core';

@Component({
  selector: 'app-creator-problem-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './problem-form.component.html',
  styleUrl: './problem-form.component.css',
})
export class CreatorProblemFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() problem: AdminProblem | null = null;
  @Input() isEdit = false;
  @Output() problemCreated = new EventEmitter<AdminProblem>();
  @Output() problemUpdated = new EventEmitter<AdminProblem>();
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  problemForm: FormGroup;
  loading = false;
  error: string | null = null;
  categories: ProblemCategory[] = [];
  tags: ProblemTag[] = [];
  loadingCategories = false;
  loadingTags = false;

  difficulties = [
    { value: 'Easy', label: 'Dễ' },
    { value: 'Medium', label: 'Trung bình' },
    { value: 'Hard', label: 'Khó' },
  ];

  commonLanguages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {
    this.problemForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTags();

    if (this.problem && this.isEdit) {
      this.populateForm(this.problem);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['problem'] &&
      this.problem &&
      this.isEdit &&
      this.problemForm
    ) {
      this.populateForm(this.problem);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private populateForm(problem: AdminProblem): void {
    this.problemForm.patchValue({
      title: problem.title || '',
      description: problem.description || '',
      difficulty: problem.difficulty || 'Easy',
      estimated_time: problem.estimated_time || '',
      category_id: problem.category_id || '',
      is_premium: problem.is_premium || false,
      is_popular: problem.is_popular || false,
      is_new: problem.is_new || false,
    });

    // Populate examples
    const examplesArray = this.problemForm.get('examples') as FormArray;
    examplesArray.clear();
    if (problem.Examples && problem.Examples.length > 0) {
      problem.Examples.forEach((example) => {
        examplesArray.push(
          this.fb.group({
            input: [example.input || '', Validators.required],
            output: [example.output || '', Validators.required],
            explanation: [example.explanation || ''],
          })
        );
      });
    }

    // Populate constraints
    const constraintsArray = this.problemForm.get('constraints') as FormArray;
    constraintsArray.clear();
    if (problem.Constraints && problem.Constraints.length > 0) {
      problem.Constraints.forEach((constraint) => {
        constraintsArray.push(
          this.fb.group({
            constraint: [
              constraint.constraint || constraint.constraint_text || '',
              Validators.required,
            ],
          })
        );
      });
    }

    // Populate starter codes
    const starterCodesArray = this.problemForm.get(
      'starter_codes'
    ) as FormArray;
    starterCodesArray.clear();
    if (problem.StarterCodes && problem.StarterCodes.length > 0) {
      problem.StarterCodes.forEach((code) => {
        starterCodesArray.push(
          this.fb.group({
            language: [code.language || '', Validators.required],
            code: [code.code || '', Validators.required],
          })
        );
      });
    }

    // Populate test cases
    const testCasesArray = this.problemForm.get('test_cases') as FormArray;
    testCasesArray.clear();
    if (problem.TestCases && problem.TestCases.length > 0) {
      problem.TestCases.forEach((testCase) => {
        const output = testCase.output || testCase.expected_output || '';
        const isHidden = testCase.is_hidden !== undefined 
          ? testCase.is_hidden 
          : (testCase.is_sample !== undefined ? !testCase.is_sample : false);
        
        testCasesArray.push(
          this.fb.group({
            input: [testCase.input || '', Validators.required],
            output: [output, Validators.required],
            is_hidden: [isHidden],
          })
        );
      });
    }

    // Populate tags
    if (problem.Tags && problem.Tags.length > 0) {
      const tagIds = problem.Tags.map((tag) => tag.id);
      this.problemForm.patchValue({ tags: tagIds });
    } else {
      this.problemForm.patchValue({ tags: [] });
    }
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.adminService
      .getProblemCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.loadingCategories = false;
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
          this.loadingCategories = false;
          this.notificationService.error(
            'Lỗi',
            'Không thể tải danh mục bài tập'
          );
        },
      });
  }

  loadTags(): void {
    this.loadingTags = true;
    this.adminService
      .getProblemTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tags) => {
          this.tags = tags;
          this.loadingTags = false;
        },
        error: (error) => {
          console.error('Failed to load tags:', error);
          this.loadingTags = false;
          this.notificationService.error('Lỗi', 'Không thể tải thẻ');
        },
      });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      difficulty: ['Easy', Validators.required],
      estimated_time: [''],
      category_id: ['', Validators.required],
      is_premium: [false],
      is_popular: [false],
      is_new: [false],
      examples: this.fb.array([]),
      constraints: this.fb.array([]),
      starter_codes: this.fb.array([]),
      test_cases: this.fb.array([]),
      tags: [[]],
    });
  }

  // Examples
  get examplesFormArray(): FormArray {
    return this.problemForm.get('examples') as FormArray;
  }

  addExample(): void {
    const exampleForm = this.fb.group({
      input: ['', Validators.required],
      output: ['', Validators.required],
      explanation: [''],
    });
    this.examplesFormArray.push(exampleForm);
  }

  removeExample(index: number): void {
    this.examplesFormArray.removeAt(index);
  }

  // Constraints
  get constraintsFormArray(): FormArray {
    return this.problemForm.get('constraints') as FormArray;
  }

  addConstraint(): void {
    const constraintForm = this.fb.group({
      constraint: ['', Validators.required],
    });
    this.constraintsFormArray.push(constraintForm);
  }

  removeConstraint(index: number): void {
    this.constraintsFormArray.removeAt(index);
  }

  // Starter Codes
  get starterCodesFormArray(): FormArray {
    return this.problemForm.get('starter_codes') as FormArray;
  }

  addStarterCode(): void {
    const starterCodeForm = this.fb.group({
      language: ['python', Validators.required],
      code: ['', Validators.required],
    });
    this.starterCodesFormArray.push(starterCodeForm);
  }

  removeStarterCode(index: number): void {
    this.starterCodesFormArray.removeAt(index);
  }

  // Test Cases
  get testCasesFormArray(): FormArray {
    return this.problemForm.get('test_cases') as FormArray;
  }

  addTestCase(): void {
    const testCaseForm = this.fb.group({
      input: ['', Validators.required],
      output: ['', Validators.required],
      is_hidden: [false],
    });
    this.testCasesFormArray.push(testCaseForm);
  }

  removeTestCase(index: number): void {
    this.testCasesFormArray.removeAt(index);
  }

  // Tags helper methods
  isTagSelected(tagId: number): boolean {
    const selectedTags = this.problemForm.get('tags')?.value || [];
    return Array.isArray(selectedTags) && selectedTags.includes(tagId);
  }

  onTagToggle(tagId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const selectedTags = this.problemForm.get('tags')?.value || [];
    let newTags: number[];

    if (checkbox.checked) {
      newTags = Array.isArray(selectedTags)
        ? [...selectedTags, tagId]
        : [tagId];
    } else {
      newTags = Array.isArray(selectedTags)
        ? selectedTags.filter((id: number) => id !== tagId)
        : [];
    }

    this.problemForm.patchValue({ tags: newTags });
  }

  onSubmit(): void {
    if (this.problemForm.invalid) {
      this.problemForm.markAllAsTouched();
      this.notificationService.error(
        'Lỗi xác thực',
        'Vui lòng điền đầy đủ các trường bắt buộc'
      );
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.problemForm.value;

    const examples =
      this.examplesFormArray.length > 0
        ? this.examplesFormArray.value.map((ex: any) => ({
            input: ex.input,
            output: ex.output,
            explanation: ex.explanation || undefined,
          }))
        : undefined;

    const constraints =
      this.constraintsFormArray.length > 0
        ? this.constraintsFormArray.value
            .filter((c: any) => {
              return c && c.constraint && typeof c.constraint === 'string' && c.constraint.trim().length > 0;
            })
            .map((c: any) => ({
              constraint: c.constraint.trim(),
            }))
        : [];

    const starter_codes =
      this.starterCodesFormArray.length > 0
        ? this.starterCodesFormArray.value.map((sc: any) => ({
            language: sc.language,
            code: sc.code,
          }))
        : undefined;

    const test_cases =
      this.testCasesFormArray.length > 0
        ? this.testCasesFormArray.value.map((tc: any) => ({
            input: tc.input,
            output: tc.output,
            is_hidden: tc.is_hidden || false,
          }))
        : undefined;

    const categoryId = typeof formValue.category_id === 'string' 
      ? parseInt(formValue.category_id, 10) 
      : formValue.category_id;

    const problemData: any = {
      title: formValue.title,
      description: formValue.description || undefined,
      difficulty: formValue.difficulty,
      estimated_time: formValue.estimated_time || undefined,
      category_id: categoryId,
      is_premium: formValue.is_premium || false,
      is_popular: formValue.is_popular || false,
      is_new: formValue.is_new || false,
      examples,
      constraints,
      starter_codes,
      test_cases,
      tags: formValue.tags && formValue.tags.length > 0 ? formValue.tags : undefined,
    };

    const operation = this.isEdit
      ? this.adminService.updateProblem(this.problem!.id, problemData)
      : this.adminService.createProblem(problemData);

    operation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (problem) => {
          this.notificationService.success(
            'Thành công',
            this.isEdit
              ? 'Cập nhật bài tập thành công'
              : 'Tạo bài tập thành công'
          );
          if (this.isEdit) {
            this.problemUpdated.emit(problem);
          } else {
            this.problemCreated.emit(problem);
          }
        },
        error: (error) => {
          console.error('Error saving problem:', error);
          this.error =
            error.error?.message ||
            error.message ||
            'Không thể lưu bài tập';
          this.notificationService.error('Lỗi', this.error);
        },
      });
  }

  onClose(): void {
    this.close.emit();
  }
}
