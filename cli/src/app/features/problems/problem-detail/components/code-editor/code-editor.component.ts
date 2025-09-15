import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Language, ExecutionResult, SubmissionResult } from '../../../../../core/services/mock-judge.service';
import { ProblemsService } from '../../../../../core/services/problems.service';
import { Judge0Service, Judge0ExecutionResult, Judge0SubmissionResult, Judge0Language } from '../../../../../core/services/judge0.service';
import { StarterCode, TestCase } from '../../../../../core/models/problem.model';
import { ThemeService } from '../../../../../core/services/theme.service';
import { forkJoin, of } from 'rxjs';

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
  styleUrl: './code-editor.component.css'
})
export class CodeEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editor', { static: true }) editorElement!: ElementRef;
  
  @Input() problem: any = null;
  @Input() starterCodes: StarterCode[] = [];
  @Input() testCases: TestCase[] = [];
  
  @Output() codeChange = new EventEmitter<string>();
  @Output() executeCode = new EventEmitter<{ code: string, language: string, input: string }>();
  @Output() submitCode = new EventEmitter<{ code: string, language: string }>();
  
  editor: any;
  currentCode: string = '';
  selectedLanguage: Language;
  supportedLanguages: Language[] = [];
  customInput: string = '';
  
  // UI States
  isExecuting: boolean = false;
  isSubmitting: boolean = false;
  isFullscreen: boolean = false;
  isLoadingLanguages: boolean = false;
  fontSize: number = 14;
  
  // Results
  executionResult: ExecutionResult | null = null;
  submissionResult: SubmissionResult | null = null;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private problemsService: ProblemsService,
    private judge0Service: Judge0Service,
    private themeService: ThemeService
  ) {
    // Initialize with default language
    this.selectedLanguage = {
      id: '63',
      name: 'JavaScript',
      extension: 'js',
      aceMode: 'javascript'
    };
  }
  
  ngOnInit(): void {
    // Listen to theme changes
    this.themeService.theme$.subscribe(theme => {
      if (this.editor && isPlatformBrowser(this.platformId)) {
        this.updateEditorTheme(theme);
      }
    });
    
    // Load supported languages from Judge0 service
    this.loadSupportedLanguages();
  }
  
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.waitForAceAndInitialize();
    }
  }
  
  ngOnDestroy(): void {
    if (this.editor) {
      // Clean up resize handler
      if (isPlatformBrowser(this.platformId) && (this.editor as any)._resizeHandler) {
        window.removeEventListener('resize', (this.editor as any)._resizeHandler);
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
      this.editor.session.setMode('ace/mode/' + this.selectedLanguage.aceMode);
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
        useSoftTabs: true
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
      
      console.log('Ace Editor initialized successfully with language:', this.selectedLanguage.name);
    } catch (error) {
      console.error('Failed to initialize Ace Editor:', error);
    }
  }
  
  private updateEditorTheme(theme: string): void {
    if (this.editor) {
      this.editor.setTheme(theme === 'dark' ? 'ace/theme/monokai' : 'ace/theme/github');
    }
  }
  
  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const languageId = target.value;
    const language = this.supportedLanguages.find(l => l.id === languageId);
    if (language) {
      console.log('Changing language to:', language.name, 'with aceMode:', language.aceMode);
      this.selectedLanguage = language;
      if (this.editor) {
        this.editor.session.setMode('ace/mode/' + language.aceMode);
        this.loadStarterCode();
        this.editor.focus();
      }
    }
  }
  
  private loadStarterCode(): void {
    const starterCode = this.starterCodes.find(
      code => code.language === this.selectedLanguage.id
    );
    
    if (this.editor) {
      if (starterCode) {
        this.editor.setValue(starterCode.code, -1);
        this.currentCode = starterCode.code;
      } else {
        // Provide a default template if no starter code is found
        const defaultCode = this.getDefaultCodeTemplate(this.selectedLanguage.id);
        this.editor.setValue(defaultCode, -1);
        this.currentCode = defaultCode;
      }
    }
  }
  
  private loadSupportedLanguages(): void {
    this.isLoadingLanguages = true;
    console.log('Loading supported languages from Judge0...');
    
    this.judge0Service.getSupportedLanguages().subscribe({
      next: (judge0Languages: Judge0Language[]) => {
        // Transform Judge0 languages to our Language interface
        this.supportedLanguages = judge0Languages.map(lang => ({
          id: lang.id,
          name: lang.name,
          extension: this.getExtensionForLanguage(lang.name.toLowerCase()),
          aceMode: this.getAceModeForLanguage(lang.name.toLowerCase())
        }));
        
        // Update selected language if it exists in the new list, otherwise use the first one
        const currentLang = this.supportedLanguages.find(l => l.id === this.selectedLanguage.id);
        if (currentLang) {
          this.selectedLanguage = currentLang;
        } else if (this.supportedLanguages.length > 0) {
          this.selectedLanguage = this.supportedLanguages[0];
        }
        
        this.isLoadingLanguages = false;
        console.log('Loaded languages successfully:', this.supportedLanguages.length);
      },
      error: (error) => {
        console.error('Failed to load languages from Judge0:', error);
        // Fallback to basic language set
        this.supportedLanguages = [
          { id: '63', name: 'JavaScript', extension: 'js', aceMode: 'javascript' },
          { id: '71', name: 'Python', extension: 'py', aceMode: 'python' },
          { id: '54', name: 'C++', extension: 'cpp', aceMode: 'c_cpp' },
          { id: '50', name: 'C', extension: 'c', aceMode: 'c_cpp' },
          { id: '62', name: 'Java', extension: 'java', aceMode: 'java' }
        ];
        this.selectedLanguage = this.supportedLanguages[0];
        this.isLoadingLanguages = false;
        console.log('Using fallback language set');
      }
    });
  }
  
  private getExtensionForLanguage(languageName: string): string {
    const extensionMap: { [key: string]: string } = {
      'javascript': 'js',
      'python': 'py',
      'java': 'java',
      'c++': 'cpp',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'cs',
      'c#': 'cs',
      'ruby': 'rb',
      'php': 'php',
      'go': 'go',
      'rust': 'rs',
      'swift': 'swift',
      'kotlin': 'kt'
    };
    
    return extensionMap[languageName] || 'txt';
  }
  
  private getAceModeForLanguage(languageName: string): string {
    const modeMap: { [key: string]: string } = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'c++': 'c_cpp',
      'cpp': 'c_cpp',
      'c': 'c_cpp',
      'csharp': 'csharp',
      'c#': 'csharp',
      'ruby': 'ruby',
      'php': 'php',
      'go': 'golang',
      'rust': 'rust',
      'swift': 'swift',
      'kotlin': 'kotlin'
    };
    
    return modeMap[languageName] || 'text';
  }
  
  private getDefaultCodeTemplate(languageId: string): string {
    const templates: { [key: string]: string } = {
      // Judge0 language IDs
      '63': '// Your JavaScript code here\nconsole.log("Hello World");', // JavaScript
      '71': '# Your Python code here\nprint("Hello World")', // Python
      '62': '// Your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}', // Java
      '54': '// Your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}', // C++
      '50': '// Your C code here\n#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}', // C
      // Legacy fallbacks for backward compatibility
      'javascript': '// Your JavaScript code here\nconsole.log("Hello World");',
      'python': '# Your Python code here\nprint("Hello World")',
      'java': '// Your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
      'cpp': '// Your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
      'c': '// Your C code here\n#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}'
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
  
  runCode(): void {
    if (!this.currentCode.trim() || this.isExecuting) return;
    
    this.isExecuting = true;
    this.executionResult = null;
    
    console.log('Executing code with Judge0:', {
      language: this.selectedLanguage.id,
      codeLength: this.currentCode.length
    });
    
    // Use Judge0 service as primary
    this.judge0Service.executeCode({
      source_code: this.currentCode,
      language: this.selectedLanguage.id,
      stdin: this.customInput || ''
    }).subscribe({
      next: (result: Judge0ExecutionResult) => {
        // Transform Judge0 result to match component's expected format
        this.executionResult = {
          success: result.status === 'completed',
          output: result.output,
          error: result.error || undefined,
          executionTime: result.execution_time,
          memoryUsed: result.memory_used // Keep in KB
        };
        this.isExecuting = false;
        console.log('Judge0 execution successful:', this.executionResult);
      },
      error: (error) => {
        console.error('Judge0 execution failed:', error);
        this.executionResult = {
          success: false,
          output: '',
          error: `Code execution failed: ${error.message || 'Unknown error occurred'}`,
          executionTime: 0,
          memoryUsed: 0
        };
        this.isExecuting = false;
      }
    });
  }
  
  submitSolution(): void {
    if (!this.currentCode.trim() || this.isSubmitting || !this.testCases.length) return;
    
    this.isSubmitting = true;
    this.submissionResult = null;
    
    console.log('Submitting solution with Judge0:', {
      language: this.selectedLanguage.id,
      testCasesCount: this.testCases.length,
      codeLength: this.currentCode.length
    });
    
    // Prepare test cases for Judge0
    const testCasesForJudge0 = this.testCases.map(tc => ({
      input: tc.input,
      expected_output: tc.expected_output
    }));
    
    // Use Judge0 service as primary
    this.judge0Service.submitCode({
      source_code: this.currentCode,
      language: this.selectedLanguage.id,
      test_cases: testCasesForJudge0
    }).subscribe({
      next: (result: Judge0SubmissionResult) => {
        // Transform Judge0 result to match component's expected format
        // Map Judge0 status to expected status types
        let mappedStatus: SubmissionResult['status'];
        if (result.status === 'accepted') {
          mappedStatus = 'Accepted';
        } else if (result.status === 'wrong') {
          mappedStatus = 'Wrong Answer';
        } else if (result.status === 'error') {
          mappedStatus = 'Runtime Error';
        } else {
          mappedStatus = 'Runtime Error'; // Default fallback
        }
        
        this.submissionResult = {
          submissionId: result.submission_id,
          status: mappedStatus,
          score: result.score,
          executionTime: result.execution_time,
          memoryUsed: result.memory_used, // Keep in KB
          testCasesPassed: result.test_cases_passed,
          totalTestCases: result.total_test_cases,
          details: result.error || undefined
        };
        this.isSubmitting = false;
        console.log('Judge0 submission successful:', this.submissionResult);
      },
      error: (error) => {
        console.error('Judge0 submission failed:', error);
        this.submissionResult = {
          submissionId: 'ERROR_' + Date.now(),
          status: 'Runtime Error',
          score: 0,
          executionTime: 0,
          memoryUsed: 0,
          testCasesPassed: 0,
          totalTestCases: this.testCases.length,
          details: `Submission failed: ${error.message || 'Unknown error occurred'}`
        };
        this.isSubmitting = false;
      }
    });
  }
  
  clearResults(): void {
    this.executionResult = null;
    this.submissionResult = null;
  }
}
