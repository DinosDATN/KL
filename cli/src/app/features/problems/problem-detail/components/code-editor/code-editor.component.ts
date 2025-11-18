import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProblemsService } from '../../../../../core/services/problems.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ContestService } from '../../../../../core/services/contest.service';
import {
  StarterCode,
  TestCase,
  SupportedLanguage,
  ExecutionResult,
  SubmissionResult,
  ProblemExample,
  BatchExampleResult,
} from '../../../../../core/models/problem.model';
import { ThemeService } from '../../../../../core/services/theme.service';
import { NotificationService } from '../../../../../core/services/notification.service';

declare var ace: any;

interface AceEditor {
  edit: (element: HTMLElement) => any;
  require: (module: string) => any;
}

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './code-editor.component.html',
  styleUrl: './code-editor.component.css',
})
export class CodeEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editor', { static: true }) editorElement!: ElementRef;

  @Input() problem: any = null;
  @Input() starterCodes: StarterCode[] = [];
  @Input() testCases: TestCase[] = [];
  @Input() examples: ProblemExample[] = [];
  @Input() contestId: number | null = null;
  @Input() contestProblemId: number | null = null;
  @Input() isContestMode: boolean = false;

  @Output() codeChange = new EventEmitter<string>();
  @Output() executeCode = new EventEmitter<{
    code: string;
    language: string;
    input: string;
  }>();
  @Output() submitCode = new EventEmitter<{ code: string; language: string }>();

  editor: any;
  currentCode: string = '';
  selectedLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[] = [];
  customInput: string = '';

  // UI States
  isExecuting: boolean = false;
  isSubmitting: boolean = false;
  isRunningExamples: boolean = false;
  isFullscreen: boolean = false;
  fontSize: number = 14;
  isLoadingLanguages: boolean = true;
  activeResultTab: number = 0;

  // Results
  executionResult: ExecutionResult | null = null;
  submissionResult: SubmissionResult | null = null;
  exampleResults: BatchExampleResult | null = null;

  // Default language configuration
  private defaultLanguage: SupportedLanguage = {
    id: 'python',
    name: 'Python 3.8.1',
    judgeId: 71,
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private problemsService: ProblemsService,
    private contestService: ContestService,
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.selectedLanguage = this.defaultLanguage;
  }

  ngOnInit(): void {
    // Load supported languages from backend
    this.loadSupportedLanguages();

    // Listen to theme changes
    this.themeService.theme$.subscribe((theme) => {
      if (this.editor && isPlatformBrowser(this.platformId)) {
        this.updateEditorTheme(theme);
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.waitForAceAndInitialize();
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      // Clean up resize handler
      if (
        isPlatformBrowser(this.platformId) &&
        (this.editor as any)._resizeHandler
      ) {
        window.removeEventListener(
          'resize',
          (this.editor as any)._resizeHandler
        );
      }
      this.editor.destroy();
    }
  }

  private waitForAceAndInitialize(): void {
    // Wait for Ace to be loaded
    const checkAce = () => {
      if (typeof ace !== 'undefined' && ace.edit) {
        this.initializeEditor();
      } else {
        setTimeout(checkAce, 100);
      }
    };
    checkAce();
  }

  private initializeEditor(): void {
    try {
      // Create the editor
      this.editor = ace.edit(this.editorElement.nativeElement);

      // Configure editor
      this.updateEditorTheme(this.themeService.getCurrentTheme());
      const aceMode = this.getAceModeForLanguage(this.selectedLanguage.id);
      this.editor.session.setMode('ace/mode/' + aceMode);
      this.editor.setFontSize(this.fontSize);

      // Enable features
      this.editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
        showPrintMargin: false,
        highlightActiveLine: true,
        highlightSelectedWord: true,
        wrap: true,
        fontSize: this.fontSize,
        tabSize: 2,
        useSoftTabs: true,
      });

      // Load starter code
      this.loadStarterCode();

      // Listen to code changes
      this.editor.on('change', () => {
        this.currentCode = this.editor.getValue();
        this.codeChange.emit(this.currentCode);
      });

      // Handle resize and make editor responsive
      this.editor.resize();

      // Add window resize listener to make editor responsive
      if (isPlatformBrowser(this.platformId)) {
        const resizeHandler = () => {
          if (this.editor) {
            setTimeout(() => this.editor.resize(), 100);
          }
        };
        window.addEventListener('resize', resizeHandler);

        // Store resize handler for cleanup
        (this.editor as any)._resizeHandler = resizeHandler;
      }

      console.log(
        'Ace Editor initialized successfully with language:',
        this.selectedLanguage.name
      );
    } catch (error) {
      console.error('Failed to initialize Ace Editor:', error);
    }
  }

  private updateEditorTheme(theme: string): void {
    if (this.editor) {
      this.editor.setTheme(
        theme === 'dark' ? 'ace/theme/monokai' : 'ace/theme/github'
      );
    }
  }

  private loadSupportedLanguages(): void {
    this.isLoadingLanguages = true;

    this.problemsService.getSupportedLanguages().subscribe({
      next: (languages) => {
        this.supportedLanguages = languages;

        // Set the first available language as default if current selection is not available
        if (
          !this.supportedLanguages.find(
            (l) => l.id === this.selectedLanguage.id
          )
        ) {
          this.selectedLanguage =
            this.supportedLanguages[0] || this.defaultLanguage;
        }

        this.isLoadingLanguages = false;
      },
      error: (error) => {
        console.error('Error loading supported languages:', error);
        // Use fallback languages
        this.supportedLanguages = [
          { id: 'python', name: 'Python 3.8.1', judgeId: 71 },
          {
            id: 'javascript',
            name: 'JavaScript (Node.js 12.14.0)',
            judgeId: 63,
          },
          { id: 'java', name: 'Java (OpenJDK 13.0.1)', judgeId: 62 },
          { id: 'cpp', name: 'C++ (GCC 9.2.0)', judgeId: 54 },
          { id: 'c', name: 'C (GCC 9.2.0)', judgeId: 50 },
        ];
        this.selectedLanguage = this.supportedLanguages[0];
        this.isLoadingLanguages = false;
      },
    });
  }

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const languageId = target.value;
    const language = this.supportedLanguages.find((l) => l.id === languageId);
    if (language) {
      console.log('Changing language to:', language.name);
      this.selectedLanguage = language;
      if (this.editor) {
        const aceMode = this.getAceModeForLanguage(language.id);
        this.editor.session.setMode('ace/mode/' + aceMode);
        this.loadStarterCode();
        this.editor.focus();
      }

      // Clear previous results
      this.clearResults();
    }
  }

  private getAceModeForLanguage(languageId: string): string {
    const modeMap: { [key: string]: string } = {
      python: 'python',
      javascript: 'javascript',
      java: 'java',
      cpp: 'c_cpp',
      c: 'c_cpp',
      csharp: 'csharp',
      go: 'golang',
      rust: 'rust',
      php: 'php',
      ruby: 'ruby',
      kotlin: 'kotlin',
      swift: 'swift',
      typescript: 'typescript',
    };
    return modeMap[languageId] || 'text';
  }

  private loadStarterCode(): void {
    const starterCode = this.starterCodes.find(
      (code) => code.language === this.selectedLanguage.id
    );

    if (this.editor) {
      if (starterCode) {
        this.editor.setValue(starterCode.code, -1);
        this.currentCode = starterCode.code;
      } else {
        // Provide a default template if no starter code is found
        const defaultCode = this.getDefaultCodeTemplate(
          this.selectedLanguage.id
        );
        this.editor.setValue(defaultCode, -1);
        this.currentCode = defaultCode;
      }
    }
  }

  private getDefaultCodeTemplate(languageId: string): string {
    const templates: { [key: string]: string } = {
      javascript:
        '// Your JavaScript code here\nfunction solution() {\n    // Write your code here\n    return null;\n}',
      python:
        '# Your Python code here\ndef solution():\n    # Write your code here\n    pass',
      java: '// Your Java code here\npublic class Solution {\n    public void solution() {\n        // Write your code here\n    }\n}',
      cpp: '// Your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      csharp:
        '// Your C# code here\nusing System;\n\npublic class Solution {\n    public void Main() {\n        // Write your code here\n    }\n}',
    };
    return templates[languageId] || '// Start coding here';
  }

  resetCode(): void {
    this.loadStarterCode();
  }

  increaseFontSize(): void {
    this.fontSize = Math.min(this.fontSize + 2, 24);
    if (this.editor) {
      this.editor.setFontSize(this.fontSize);
    }
  }

  decreaseFontSize(): void {
    this.fontSize = Math.max(this.fontSize - 2, 10);
    if (this.editor) {
      this.editor.setFontSize(this.fontSize);
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
  }

  private validateCode(): boolean {
    if (!this.currentCode.trim()) {
      this.notificationService.codeValidationError(
        'Vui lòng nhập code trước khi chạy.'
      );
      return false;
    }

    if (this.currentCode.length > 64 * 1024) {
      // 64KB limit
      this.notificationService.codeValidationError(
        'Code quá dài. Giới hạn tối đa là 64KB.'
      );
      return false;
    }

    return true;
  }

  runCode(): void {
    if (!this.validateCode() || this.isExecuting) return;

    this.isExecuting = true;
    this.executionResult = null;

    console.log('Executing code with language:', this.selectedLanguage.name);

    this.problemsService
      .executeCode(this.currentCode, this.selectedLanguage.id, this.customInput)
      .subscribe({
        next: (result) => {
          console.log('Execution result:', result);
          const formattedResult = this.formatExecutionResult(result);
          this.executionResult = formattedResult;

          if (formattedResult.success) {
            this.notificationService.codeExecutionSuccess(
              formattedResult.executionTime,
              formattedResult.memoryUsed
            );
          } else {
            this.notificationService.codeExecutionError(
              formattedResult.error || 'Code execution failed'
            );
          }

          this.isExecuting = false;
        },
        error: (error) => {
          console.error('Code execution failed:', error);

          // Handle specific error types
          if (error.status === 429) {
            this.notificationService.rateLimitError();
          } else if (error.status === 503) {
            this.notificationService.judgeApiError();
          } else if (error.status === 0) {
            this.notificationService.networkError();
          } else {
            this.notificationService.codeExecutionError(
              error.error?.message || error.message || 'Code execution failed'
            );
          }

          this.executionResult = {
            success: false,
            stdout: '',
            stderr: error.message || 'Code execution failed',
            error: error.message || 'Unknown error occurred',
            executionTime: 0,
            memoryUsed: 0,
          };
          this.isExecuting = false;
        },
      });
  }

  runWithExamples(): void {
    if (!this.validateCode() || this.isRunningExamples) return;
    
    if (!this.examples || this.examples.length === 0) {
      this.notificationService.codeValidationError(
        'Không có example nào để chạy.'
      );
      return;
    }
    
    this.isRunningExamples = true;
    this.exampleResults = null;
    this.activeResultTab = 0;
    
    console.log(
      'Running code with examples, language:',
      this.selectedLanguage.name
    );
    
    this.problemsService
      .executeCodeWithExamples(this.currentCode, this.selectedLanguage.id, this.examples)
      .subscribe({
        next: (result) => {
          console.log('Examples execution result:', result);
          this.exampleResults = result;
          
          // Show appropriate notification based on results
          const { overallStatus, passedCount, totalCount } = result;
          if (overallStatus === 'success') {
            this.notificationService.codeExecutionSuccess(
              result.averageExecutionTime,
              result.maxMemoryUsed
            );
          } else if (overallStatus === 'partial') {
            this.notificationService.codeExecutionError(
              `${passedCount}/${totalCount} examples passed`
            );
          } else {
            this.notificationService.codeExecutionError(
              'All examples failed'
            );
          }
          
          this.isRunningExamples = false;
        },
        error: (error) => {
          console.error('Examples execution failed:', error);
          
          // Handle specific error types
          if (error.status === 429) {
            this.notificationService.rateLimitError();
          } else if (error.status === 503) {
            this.notificationService.judgeApiError();
          } else if (error.status === 0) {
            this.notificationService.networkError();
          } else {
            this.notificationService.codeExecutionError(
              error.error?.message ||
                error.message ||
                'Examples execution failed'
            );
          }
          
          this.isRunningExamples = false;
        },
      });
  }

  submitSolution(): void {
    if (!this.validateCode() || this.isSubmitting) return;

    // Get current user ID from auth service
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || null;

    // Notify user if not logged in (but still allow submission for demo purposes)
    if (!userId) {
      this.notificationService.codeValidationError(
        'Đăng nhập để lưu kết quả làm bài và theo dõi tiến độ của bạn.'
      );
    }

    this.isSubmitting = true;
    this.submissionResult = null;

    console.log(
      'Submitting solution with language:',
      this.selectedLanguage.name
    );
    console.log('Submitting with user ID:', userId);
    console.log('Contest mode:', this.isContestMode);

    // Check if this is a contest submission
    if (this.isContestMode && this.contestId && this.contestProblemId) {
      // Submit to contest
      this.contestService.submitToContest(
        this.contestId,
        this.problem?.id || 1,
        {
          sourceCode: this.currentCode,
          language: this.selectedLanguage.id
        }
      ).subscribe({
        next: (response) => {
          console.log('Contest submission result:', response);
          
          if (response.success && response.data) {
            const result = response.data.execution_result;
            const formattedResult = this.formatSubmissionResult(result);
            this.submissionResult = formattedResult;

            // Show success notification with contest context
            this.notificationService.codeSubmissionSuccess(
              formattedResult.score,
              formattedResult.testCasesPassed,
              formattedResult.totalTestCases
            );
          }

          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Contest submission failed:', error);
          this.handleSubmissionError(error);
          this.isSubmitting = false;
        }
      });
    } else {
      // Regular problem submission
      const submitMethod =
        this.problemsService.batchSubmitCode || this.problemsService.submitCode;

      submitMethod
        .call(
          this.problemsService,
          this.problem?.id || 1,
          this.currentCode,
          this.selectedLanguage.id,
          userId || undefined
        )
        .subscribe({
        next: (result) => {
          console.log('Submission result:', result);
          const formattedResult = this.formatSubmissionResult(result);
          this.submissionResult = formattedResult;

          // Show success notification
          this.notificationService.codeSubmissionSuccess(
            formattedResult.score,
            formattedResult.testCasesPassed,
            formattedResult.totalTestCases
          );

          this.isSubmitting = false;
        },
        error: (error) => {
          this.handleSubmissionError(error);
          this.isSubmitting = false;
        },
      });
    }
  }

  private handleSubmissionError(error: any): void {
    console.error('Code submission failed:', error);

    // Handle specific error types
    if (error.status === 429) {
      this.notificationService.rateLimitError();
    } else if (error.status === 503) {
      this.notificationService.judgeApiError();
    } else if (error.status === 0) {
      this.notificationService.networkError();
    } else {
      this.notificationService.codeSubmissionError(
        error.error?.message || error.message || 'Code submission failed'
      );
    }

    this.submissionResult = {
      submissionId: 'ERROR_' + Date.now(),
      status: 'error',
      score: 0,
      executionTime: 0,
      memoryUsed: 0,
      testCasesPassed: 0,
      totalTestCases: this.testCases.length,
      error: error.error?.message || error.message || 'Code submission failed',
    };
  }

  clearResults(): void {
    this.executionResult = null;
    this.submissionResult = null;
    this.exampleResults = null;
    this.activeResultTab = 0;
  }
  
  setActiveResultTab(index: number): void {
    this.activeResultTab = index;
  }
  
  getExampleStatusClass(passed: boolean): string {
    return passed ? 'text-green-600' : 'text-red-600';
  }
  
  getExampleStatusIcon(passed: boolean): string {
    return passed ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  private formatExecutionResult(result: any): ExecutionResult {
    return {
      success: result.success || false,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      error: result.error || null,
      executionTime: result.executionTime || 0,
      memoryUsed: result.memoryUsed || 0,
    };
  }

  private formatSubmissionResult(result: any): SubmissionResult {
    return {
      submissionId: result.submissionId || 'UNKNOWN',
      status: this.mapStatus(result.status),
      score: result.score || 0,
      executionTime: result.executionTime || 0,
      memoryUsed: result.memoryUsed || 0,
      testCasesPassed: result.testCasesPassed || 0,
      totalTestCases: result.totalTestCases || 0,
      testCaseResults: result.testCaseResults || [],
      error: result.error || undefined,
    };
  }

  private mapStatus(
    status: string
  ): 'accepted' | 'wrong' | 'error' | 'timeout' | 'pending' {
    const statusMap: {
      [key: string]: 'accepted' | 'wrong' | 'error' | 'timeout' | 'pending';
    } = {
      accepted: 'accepted',
      wrong: 'wrong',
      error: 'error',
      timeout: 'timeout',
      pending: 'pending',
      Accepted: 'accepted',
      'Wrong Answer': 'wrong',
      'Runtime Error': 'error',
      'Time Limit Exceeded': 'timeout',
      'Compilation Error': 'error',
    };
    return statusMap[status] || 'pending';
  }

  getStatusDisplayText(status: string): string {
    const displayMap: { [key: string]: string } = {
      accepted: 'Đúng',
      wrong: 'Sai',
      error: 'Lỗi',
      timeout: 'Quá thời gian',
      pending: 'Đang xử lý',
    };
    return displayMap[status] || status;
  }
}
