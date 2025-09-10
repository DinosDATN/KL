import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockJudgeService, Language, ExecutionResult, SubmissionResult } from '../../../../../core/services/mock-judge.service';
import { StarterCode, TestCase } from '../../../../../core/models/problem.model';
import { ThemeService } from '../../../../../core/services/theme.service';

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
  customInput: string = '';
  
  // UI States
  isExecuting: boolean = false;
  isSubmitting: boolean = false;
  isFullscreen: boolean = false;
  fontSize: number = 14;
  
  // Results
  executionResult: ExecutionResult | null = null;
  submissionResult: SubmissionResult | null = null;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public mockJudgeService: MockJudgeService,
    private themeService: ThemeService
  ) {
    this.selectedLanguage = this.mockJudgeService.supportedLanguages[0];
  }
  
  ngOnInit(): void {
    // Listen to theme changes
    this.themeService.theme$.subscribe(theme => {
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
    const language = this.mockJudgeService.supportedLanguages.find(l => l.id === languageId);
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
  
  private getDefaultCodeTemplate(languageId: string): string {
    const templates: { [key: string]: string } = {
      'javascript': '// Your JavaScript code here\nfunction solution() {\n    // Write your code here\n    return null;\n}',
      'python': '# Your Python code here\ndef solution():\n    # Write your code here\n    pass',
      'java': '// Your Java code here\npublic class Solution {\n    public void solution() {\n        // Write your code here\n    }\n}',
      'cpp': '// Your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      'csharp': '// Your C# code here\nusing System;\n\npublic class Solution {\n    public void Main() {\n        // Write your code here\n    }\n}'
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
    
    this.mockJudgeService.executeCode(
      this.currentCode, 
      this.selectedLanguage.id, 
      this.customInput
    ).subscribe({
      next: (result) => {
        this.executionResult = result;
        this.isExecuting = false;
      },
      error: (error) => {
        console.error('Execution error:', error);
        this.isExecuting = false;
      }
    });
  }
  
  submitSolution(): void {
    if (!this.currentCode.trim() || this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.submissionResult = null;
    
    this.mockJudgeService.submitCode(
      this.currentCode,
      this.selectedLanguage.id,
      this.problem?.id || 1,
      this.testCases
    ).subscribe({
      next: (result) => {
        this.submissionResult = result;
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Submission error:', error);
        this.isSubmitting = false;
      }
    });
  }
  
  clearResults(): void {
    this.executionResult = null;
    this.submissionResult = null;
  }
}
