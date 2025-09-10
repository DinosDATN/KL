import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  testCaseResults?: TestCaseResult[];
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed: boolean;
  executionTime?: number;
  error?: string;
}

export interface SubmissionResult {
  submissionId: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Compile Error';
  score: number;
  executionTime?: number;
  memoryUsed?: number;
  testCasesPassed: number;
  totalTestCases: number;
  details?: string;
}

export interface Language {
  id: string;
  name: string;
  extension: string;
  aceMode: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockJudgeService {

  // Supported programming languages
  readonly supportedLanguages: Language[] = [
    { id: 'python', name: 'Python 3', extension: 'py', aceMode: 'python' },
    { id: 'javascript', name: 'JavaScript', extension: 'js', aceMode: 'javascript' },
    { id: 'java', name: 'Java', extension: 'java', aceMode: 'java' },
    { id: 'cpp', name: 'C++', extension: 'cpp', aceMode: 'c_cpp' }
  ];

  constructor() { }

  /**
   * Mock code execution (Run button)
   */
  executeCode(code: string, language: string, input: string = ''): Observable<ExecutionResult> {
    // Simulate API delay
    return of(this.simulateExecution(code, language, input)).pipe(
      delay(1000 + Math.random() * 2000) // 1-3 seconds delay
    );
  }

  /**
   * Mock code submission (Submit button)
   */
  submitCode(code: string, language: string, problemId: number, testCases: any[]): Observable<SubmissionResult> {
    // Simulate API delay
    return of(this.simulateSubmission(code, language, problemId, testCases)).pipe(
      delay(2000 + Math.random() * 3000) // 2-5 seconds delay
    );
  }

  private simulateExecution(code: string, language: string, input: string): ExecutionResult {
    // Simulate random execution outcomes
    const rand = Math.random();
    
    // Check for obvious syntax errors
    if (code.trim() === '' || code.includes('TODO')) {
      return {
        success: false,
        error: 'Code is incomplete. Please implement your solution.',
        executionTime: 0,
        memoryUsed: 0
      };
    }

    // 20% chance of runtime error
    if (rand < 0.2) {
      return {
        success: false,
        error: this.getRandomError(language),
        executionTime: Math.floor(Math.random() * 50),
        memoryUsed: Math.floor(Math.random() * 10 + 5)
      };
    }

    // Successful execution
    return {
      success: true,
      output: this.generateMockOutput(language, input),
      executionTime: Math.floor(Math.random() * 100 + 10),
      memoryUsed: Math.floor(Math.random() * 20 + 10)
    };
  }

  private simulateSubmission(code: string, language: string, problemId: number, testCases: any[]): SubmissionResult {
    const submissionId = 'SUB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const rand = Math.random();

    // Check for incomplete code
    if (code.trim() === '' || code.includes('TODO')) {
      return {
        submissionId,
        status: 'Compile Error',
        score: 0,
        testCasesPassed: 0,
        totalTestCases: testCases.length,
        details: 'Code is incomplete. Please implement your solution.'
      };
    }

    const totalTestCases = testCases.length || 3;
    let testCasesPassed: number;
    let status: SubmissionResult['status'];
    let score: number;

    if (rand < 0.1) {
      // 10% Runtime Error
      status = 'Runtime Error';
      testCasesPassed = 0;
      score = 0;
    } else if (rand < 0.15) {
      // 5% Time Limit Exceeded
      status = 'Time Limit Exceeded';
      testCasesPassed = Math.floor(totalTestCases * 0.6);
      score = Math.floor((testCasesPassed / totalTestCases) * 100);
    } else if (rand < 0.4) {
      // 25% Wrong Answer
      status = 'Wrong Answer';
      testCasesPassed = Math.floor(totalTestCases * (0.3 + Math.random() * 0.6));
      score = Math.floor((testCasesPassed / totalTestCases) * 100);
    } else {
      // 60% Accepted
      status = 'Accepted';
      testCasesPassed = totalTestCases;
      score = 100;
    }

    return {
      submissionId,
      status,
      score,
      executionTime: Math.floor(Math.random() * 200 + 50),
      memoryUsed: Math.floor(Math.random() * 50 + 20),
      testCasesPassed,
      totalTestCases,
      details: this.getSubmissionDetails(status, testCasesPassed, totalTestCases)
    };
  }

  private getRandomError(language: string): string {
    const errors = {
      python: [
        'NameError: name \'x\' is not defined',
        'IndexError: list index out of range',
        'TypeError: unsupported operand type(s)',
        'IndentationError: expected an indented block'
      ],
      javascript: [
        'ReferenceError: x is not defined',
        'TypeError: Cannot read property of undefined',
        'SyntaxError: Unexpected token',
        'RangeError: Maximum call stack size exceeded'
      ],
      java: [
        'Exception in thread "main" java.lang.NullPointerException',
        'Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException',
        'Exception in thread "main" java.lang.NumberFormatException',
        'Compilation error: cannot find symbol'
      ],
      cpp: [
        'Segmentation fault (core dumped)',
        'Runtime error: array index out of bounds',
        'Compilation error: \'x\' was not declared in this scope',
        'Runtime error: division by zero'
      ]
    };
    
    const langErrors = errors[language as keyof typeof errors] || errors.python;
    return langErrors[Math.floor(Math.random() * langErrors.length)];
  }

  private generateMockOutput(language: string, input: string): string {
    if (input.trim()) {
      return `Output for input: ${input}\nResult: ${Math.floor(Math.random() * 100)}`;
    }
    
    const outputs = [
      '42',
      '[1, 2, 3]',
      'true',
      '"Hello World"',
      '3.14159',
      'null'
    ];
    
    return outputs[Math.floor(Math.random() * outputs.length)];
  }

  private getSubmissionDetails(status: string, passed: number, total: number): string {
    switch (status) {
      case 'Accepted':
        return `Congratulations! Your solution passed all ${total} test cases.`;
      case 'Wrong Answer':
        return `Your solution passed ${passed} out of ${total} test cases. Please review your logic.`;
      case 'Runtime Error':
        return 'Your code encountered a runtime error. Please check for null pointers, array bounds, etc.';
      case 'Time Limit Exceeded':
        return `Your solution is too slow. It passed ${passed} out of ${total} test cases before timing out.`;
      case 'Memory Limit Exceeded':
        return 'Your solution uses too much memory. Try to optimize your space complexity.';
      case 'Compile Error':
        return 'Your code failed to compile. Please fix syntax errors and try again.';
      default:
        return 'Unknown error occurred.';
    }
  }
}
