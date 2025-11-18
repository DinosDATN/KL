import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, forkJoin } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import {
  Problem,
  ProblemCategory,
  Tag,
  ProblemTag,
  ProblemExample,
  ProblemConstraint,
  StarterCode,
  TestCase,
  SubmissionCode,
  Submission,
  ProblemComment,
  ExampleResult,
  BatchExampleResult
} from '../models/problem.model';
import {
  mockProblems,
  mockProblemCategories,
  mockTags,
  mockProblemTags,
  mockProblemExamples,
  mockProblemConstraints,
  mockStarterCodes,
  mockTestCases,
  mockSubmissionCodes,
  mockSubmissions,
  mockProblemComments
} from './problem-mock-data';

@Injectable({
  providedIn: 'root'
})
export class ProblemsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // Problem operations
  getProblems(): Observable<Problem[]> {
    // Return mock data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      return of(mockProblems);
    }

    return this.http.get<{success: boolean, data: Problem[], total_items?: number}>(`${this.apiUrl}/problems?all=true`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching problems:', error);
          return of(mockProblems); // Fallback to mock data
        })
      );
  }

  getPaginatedProblems(page: number = 1, limit: number = 10, filters?: {
    difficulty?: string,
    category_id?: number,
    is_premium?: boolean,
    is_new?: boolean,
    is_popular?: boolean
  }): Observable<{data: Problem[], pagination: any}> {
    // Return mock data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = mockProblems.slice(startIndex, endIndex);
      
      return of({
        data: paginatedData,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(mockProblems.length / limit),
          total_items: mockProblems.length,
          items_per_page: limit
        }
      });
    }

    const params: any = { page: page.toString(), limit: limit.toString() };
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return this.http.get<{success: boolean, data: Problem[], pagination: any}>(`${this.apiUrl}/problems`, { params })
      .pipe(
        map(response => ({ data: response.data, pagination: response.pagination })),
        catchError(error => {
          console.error('Error fetching paginated problems:', error);
          // Fallback to mock data pagination
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedData = mockProblems.slice(startIndex, endIndex);
          
          return of({
            data: paginatedData,
            pagination: {
              current_page: page,
              total_pages: Math.ceil(mockProblems.length / limit),
              total_items: mockProblems.length,
              items_per_page: limit
            }
          });
        })
      );
  }

  getProblemById(id: number): Observable<Problem | null> {
    return this.http.get<{success: boolean, data: Problem}>(`${this.apiUrl}/problems/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching problem:', error);
          const problem = mockProblems.find(p => p.id === id);
          return of(problem || null);
        })
      );
  }

  getProblemsByCategory(categoryId: number): Observable<Problem[]> {
    const problems = mockProblems.filter(p => p.category_id === categoryId);
    return of(problems);
  }

  getProblemsByDifficulty(difficulty: string): Observable<Problem[]> {
    const problems = mockProblems.filter(p => p.difficulty === difficulty);
    return of(problems);
  }

  searchProblems(searchTerm: string): Observable<Problem[]> {
    const problems = mockProblems.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return of(problems);
  }

  // Category operations
  getCategories(): Observable<ProblemCategory[]> {
    // Return mock data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      return of(mockProblemCategories);
    }

    return this.http.get<{success: boolean, data: ProblemCategory[]}>(`${this.apiUrl}/problems/data/categories`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching categories:', error);
          return of(mockProblemCategories);
        })
      );
  }

  getCategoryById(id: number): Observable<ProblemCategory | null> {
    const category = mockProblemCategories.find(c => c.id === id);
    return of(category || null);
  }

  // Tag operations
  getTags(): Observable<Tag[]> {
    // Return mock data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      return of(mockTags);
    }

    return this.http.get<{success: boolean, data: Tag[]}>(`${this.apiUrl}/problems/data/tags`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching tags:', error);
          return of(mockTags);
        })
      );
  }

  getTagById(id: number): Observable<Tag | null> {
    const tag = mockTags.find(t => t.id === id);
    return of(tag || null);
  }

  getProblemTags(problemId: number): Observable<Tag[]> {
    return this.http.get<{success: boolean, data: Tag[]}>(`${this.apiUrl}/problems/${problemId}/tags`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching problem tags:', error);
          // Fallback to mock data
          const problemTagIds = mockProblemTags
            .filter(pt => pt.problem_id === problemId)
            .map(pt => pt.tag_id);
          const tags = mockTags.filter(tag => problemTagIds.includes(tag.id));
          return of(tags);
        })
      );
  }

  getTagNamesByProblemId(problemId: number): string[] {
    const problemTagIds = mockProblemTags
      .filter(pt => pt.problem_id === problemId)
      .map(pt => pt.tag_id);
    
    return mockTags
      .filter(tag => problemTagIds.includes(tag.id))
      .map(tag => tag.name);
  }

  // Problem examples
  getProblemExamples(problemId: number): Observable<ProblemExample[]> {
    return this.http.get<{success: boolean, data: ProblemExample[]}>(`${this.apiUrl}/problems/${problemId}/examples`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching problem examples:', error);
          // Fallback to mock data
          const examples = mockProblemExamples.filter(e => e.problem_id === problemId);
          return of(examples);
        })
      );
  }

  // Problem constraints
  getProblemConstraints(problemId: number): Observable<ProblemConstraint[]> {
    const constraints = mockProblemConstraints.filter(c => c.problem_id === problemId);
    return of(constraints);
  }

  // Starter codes
  getStarterCodes(problemId: number): Observable<StarterCode[]> {
    return this.http.get<{success: boolean, data: StarterCode[]}>(`${this.apiUrl}/problems/${problemId}/starter-codes`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching starter codes:', error);
          const codes = mockStarterCodes.filter(sc => sc.problem_id === problemId);
          return of(codes);
        })
      );
  }

  getStarterCodeByLanguage(problemId: number, language: string): Observable<StarterCode | null> {
    const code = mockStarterCodes.find(sc => 
      sc.problem_id === problemId && sc.language === language
    );
    return of(code || null);
  }

  // Test cases
  getTestCases(problemId: number): Observable<TestCase[]> {
    return this.http.get<{success: boolean, data: TestCase[]}>(`${this.apiUrl}/problems/${problemId}/test-cases`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching test cases:', error);
          const testCases = mockTestCases.filter(tc => tc.problem_id === problemId);
          return of(testCases);
        })
      );
  }

  getTestCasesByProblemId(problemId: number): TestCase[] {
    return mockTestCases.filter(tc => tc.problem_id === problemId);
  }

  getSampleTestCases(problemId: number): Observable<TestCase[]> {
    const testCases = mockTestCases.filter(tc => 
      tc.problem_id === problemId && tc.is_sample
    );
    return of(testCases);
  }

  // Submissions
  getSubmissions(problemId: number): Observable<Submission[]> {
    const submissions = mockSubmissions.filter(s => s.problem_id === problemId);
    return of(submissions);
  }

  getSubmissionsByUser(userId: number): Observable<Submission[]> {
    const submissions = mockSubmissions.filter(s => s.user_id === userId);
    return of(submissions);
  }

  // Comments
  getProblemComments(problemId: number): Observable<ProblemComment[]> {
    const comments = mockProblemComments.filter(c => c.problem_id === problemId);
    return of(comments);
  }

  // Statistics
  getProblemStats(): Observable<{
    totalProblems: number;
    easyProblems: number;
    mediumProblems: number;
    hardProblems: number;
    totalSubmissions: number;
    totalUsers: number;
  }> {
    const totalProblems = mockProblems.length;
    const easyProblems = mockProblems.filter(p => p.difficulty === 'Easy').length;
    const mediumProblems = mockProblems.filter(p => p.difficulty === 'Medium').length;
    const hardProblems = mockProblems.filter(p => p.difficulty === 'Hard').length;
    const totalSubmissions = mockProblems.reduce((sum, p) => sum + p.total_submissions, 0);
    const totalUsers = mockProblems.reduce((sum, p) => sum + p.solved_count, 0);

    return of({
      totalProblems,
      easyProblems,
      mediumProblems,
      hardProblems,
      totalSubmissions,
      totalUsers
    });
  }

  // Featured/Popular problems
  getFeaturedProblems(): Observable<Problem[]> {
    const featured = mockProblems
      .filter(p => p.is_popular || p.is_new)
      .slice(0, 6);
    return of(featured);
  }

  getPopularProblems(limit?: number): Observable<Problem[]> {
    // Return mock data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      const popular = mockProblems
        .filter(p => p.is_popular)
        .sort((a, b) => b.likes - a.likes);
      return of(limit ? popular.slice(0, limit) : popular);
    }

    const params: { [key: string]: string } = {};
    if (limit) {
      params['limit'] = limit.toString();
    } else {
      params['all'] = 'true';
    }
    
    return this.http.get<{success: boolean, data: Problem[], total_items?: number}>(`${this.apiUrl}/problems/popular`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching popular problems:', error);
          // Fallback to mock data
          const popular = mockProblems
            .filter(p => p.is_popular)
            .sort((a, b) => b.likes - a.likes);
          return of(limit ? popular.slice(0, limit) : popular);
        })
      );
  }

  getRecentProblems(limit?: number): Observable<Problem[]> {
    // Return mock data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      const recent = mockProblems
        .filter(p => p.is_new)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return of(limit ? recent.slice(0, limit) : recent);
    }

    const params: { [key: string]: string } = {};
    if (limit) {
      params['limit'] = limit.toString();
    } else {
      params['all'] = 'true';
    }
    
    return this.http.get<{success: boolean, data: Problem[], total_items?: number}>(`${this.apiUrl}/problems/new`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching recent problems:', error);
          // Fallback to mock data
          const recent = mockProblems
            .filter(p => p.is_new)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          return of(limit ? recent.slice(0, limit) : recent);
        })
      );
  }

  // Difficulty-based filtering
  getEasyProblems(): Observable<Problem[]> {
    return this.getProblemsByDifficulty('Easy');
  }

  getMediumProblems(): Observable<Problem[]> {
    return this.getProblemsByDifficulty('Medium');
  }

  getHardProblems(): Observable<Problem[]> {
    return this.getProblemsByDifficulty('Hard');
  }

  // Code execution methods
  executeCode(sourceCode: string, language: string, input: string = ''): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return mock result during SSR
      return of({
        success: true,
        stdout: 'Sample output',
        stderr: '',
        executionTime: 0.1,
        memoryUsed: 1024
      });
    }

    return this.http.post<{success: boolean, data: any}>(
      `${this.apiUrl}/problems/execute`, 
      {
        sourceCode,
        language,
        input
      },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error executing code:', error);
        // Return a user-friendly error response
        const errorResponse = {
          success: false,
          error: error.error?.message || 'Code execution failed',
          stdout: '',
          stderr: error.error?.message || 'Unknown error occurred',
          executionTime: 0,
          memoryUsed: 0
        };
        return of(errorResponse);
      })
    );
  }

  submitCode(problemId: number, sourceCode: string, language: string, userId?: number): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return mock result during SSR
      return of({
        submissionId: 'MOCK_SUB_' + Date.now(),
        status: 'accepted',
        score: 100,
        testCasesPassed: 3,
        totalTestCases: 3
      });
    }

    return this.http.post<{success: boolean, data: any}>(
      `${this.apiUrl}/problems/${problemId}/submit`, 
      {
        sourceCode,
        language,
        userId
      },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error submitting code:', error);
        // Return a user-friendly error response
        const errorResponse = {
          submissionId: 'ERROR_' + Date.now(),
          status: 'error',
          score: 0,
          testCasesPassed: 0,
          totalTestCases: 0,
          error: error.error?.message || 'Code submission failed'
        };
        return of(errorResponse);
      })
    );
  }

  // Batch submit code (enhanced performance)
  batchSubmitCode(problemId: number, sourceCode: string, language: string, userId?: number): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.submitCode(problemId, sourceCode, language, userId);
    }

    return this.http.post<{success: boolean, data: any}>(
      `${this.apiUrl}/problems/${problemId}/batch-submit`, 
      {
        sourceCode,
        language,
        userId
      },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error in batch submit:', error);
        // Fallback to regular submit
        return this.submitCode(problemId, sourceCode, language, userId);
      })
    );
  }

  // Create async submission
  createAsyncSubmission(sourceCode: string, language: string, input: string = '', expectedOutput?: string): Observable<{token: string, message: string}> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ token: 'MOCK_TOKEN_' + Date.now(), message: 'Mock submission created' });
    }

    return this.http.post<{success: boolean, data: {token: string, message: string}}>(
      `${this.apiUrl}/problems/async-submit`, 
      {
        sourceCode,
        language,
        input,
        expectedOutput
      },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error creating async submission:', error);
        throw error;
      })
    );
  }

  // Get submission result by token
  getSubmissionResult(token: string, base64Encoded: boolean = false): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ token, formattedResult: { success: true, stdout: 'Mock result' } });
    }

    return this.http.get<{success: boolean, data: any}>(
      `${this.apiUrl}/problems/submission/${token}`, 
      {
        params: { base64_encoded: base64Encoded.toString() },
        withCredentials: true // ✅ Send HttpOnly cookie
      }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error getting submission result:', error);
        throw error;
      })
    );
  }

  // Check Judge0 API health
  checkJudgeHealth(): Observable<{status: string, info?: any}> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ status: 'healthy' });
    }

    return this.http.get<{success: boolean, data: {status: string, info?: any}}>(`${this.apiUrl}/problems/judge/health`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error checking judge health:', error);
          return of({ status: 'unhealthy', error: error.message });
        })
      );
  }

  getSupportedLanguages(): Observable<any[]> {
    // Return mock data during SSR
    if (!isPlatformBrowser(this.platformId)) {
      return of([
        { id: 'python', name: 'Python 3.8.1', judgeId: 71 },
        { id: 'javascript', name: 'JavaScript (Node.js 12.14.0)', judgeId: 63 },
        { id: 'java', name: 'Java (OpenJDK 13.0.1)', judgeId: 62 },
        { id: 'cpp', name: 'C++ (GCC 9.2.0)', judgeId: 54 },
        { id: 'c', name: 'C (GCC 9.2.0)', judgeId: 50 }
      ]);
    }

    return this.http.get<{success: boolean, data: any[]}>(`${this.apiUrl}/problems/data/languages`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching supported languages:', error);
          // Return enhanced default languages as fallback
          return of([
            { id: 'python', name: 'Python 3.8.1', judgeId: 71 },
            { id: 'javascript', name: 'JavaScript (Node.js 12.14.0)', judgeId: 63 },
            { id: 'java', name: 'Java (OpenJDK 13.0.1)', judgeId: 62 },
            { id: 'cpp', name: 'C++ (GCC 9.2.0)', judgeId: 54 },
            { id: 'c', name: 'C (GCC 9.2.0)', judgeId: 50 },
            { id: 'csharp', name: 'C# (Mono 6.6.0.161)', judgeId: 51 },
            { id: 'go', name: 'Go (1.13.5)', judgeId: 60 },
            { id: 'rust', name: 'Rust (1.40.0)', judgeId: 73 },
            { id: 'php', name: 'PHP (7.4.1)', judgeId: 68 },
            { id: 'ruby', name: 'Ruby (2.7.0)', judgeId: 72 },
            { id: 'kotlin', name: 'Kotlin (1.3.70)', judgeId: 78 },
            { id: 'swift', name: 'Swift (5.2.3)', judgeId: 79 },
            { id: 'typescript', name: 'TypeScript (3.7.4)', judgeId: 74 }
          ]);
        })
      );
  }

  // Get all submissions for assignment dashboard
  getAllSubmissions(filters?: {
    problemId?: number,
    userId?: number,
    status?: string,
    language?: string,
    page?: number,
    limit?: number
  }): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ data: [], pagination: { total_items: 0, current_page: 1, total_pages: 1 } });
    }

    const params: { [key: string]: string } = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return this.http.get<{success: boolean, data: any[], pagination: any}>(
      `${this.apiUrl}/problems/dashboard/submissions`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error fetching all submissions:', error);
        return of({ success: false, data: [], pagination: { total_items: 0, current_page: 1, total_pages: 1 } });
      })
    );
  }

  // Get submission statistics for assignment dashboard
  getSubmissionStats(filters?: {
    problemId?: number,
    userId?: number
  }): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({
        totalSubmissions: 0,
        statusStats: {},
        languageStats: {},
        uniqueUsers: 0,
        submissionsOverTime: []
      });
    }

    const params: { [key: string]: string } = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }

    return this.http.get<{success: boolean, data: any}>(
      `${this.apiUrl}/problems/dashboard/stats`, 
      { params, withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching submission statistics:', error);
        return of({
          totalSubmissions: 0,
          statusStats: {},
          languageStats: {},
          uniqueUsers: 0,
          submissionsOverTime: []
        });
      })
    );
  }

  // Get user submissions history
  getUserSubmissions(userId: number, filters?: {
    problemId?: number,
    status?: string,
    language?: string,
    page?: number,
    limit?: number
  }): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ data: [], pagination: { total_items: 0, current_page: 1, total_pages: 1 } });
    }

    const allFilters = { ...filters, userId };
    return this.getAllSubmissions(allFilters);
  }

  // Execute code with examples (Run with Example button)
  executeCodeWithExamples(sourceCode: string, language: string, examples: ProblemExample[]): Observable<BatchExampleResult> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return mock result during SSR
      const mockResults = examples.map((example, index) => ({
        exampleId: example.id,
        input: example.input,
        expectedOutput: example.output,
        actualOutput: example.output, // Mock successful execution
        passed: true,
        executionTime: 100,
        memoryUsed: 1024,
        error: null,
        explanation: example.explanation
      }));
      
      return of({
        results: mockResults,
        overallStatus: 'success',
        passedCount: examples.length,
        totalCount: examples.length,
        averageExecutionTime: 100,
        maxMemoryUsed: 1024
      });
    }

    // Get problem ID from the first example (all examples should belong to the same problem)
    const problemId = examples[0]?.problem_id;
    if (!problemId) {
      return of({
        results: [],
        overallStatus: 'failure',
        passedCount: 0,
        totalCount: 0,
        averageExecutionTime: 0,
        maxMemoryUsed: 0
      });
    }

    // Call the backend API endpoint
    return this.http.post<{success: boolean, data: BatchExampleResult}>(
      `${this.apiUrl}/problems/${problemId}/execute-examples`,
      {
        sourceCode,
        language
      },
      { withCredentials: true } // ✅ Send HttpOnly cookie
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error executing code with examples:', error);
        
        // Fallback to client-side execution (existing logic)
        const executionObservables = examples.map(example => 
          this.executeCode(sourceCode, language, example.input).pipe(
            map(result => {
              const passed = result.success && 
                            result.stdout && 
                            result.stdout.trim() === example.output.trim();
              
              return {
                exampleId: example.id,
                input: example.input,
                expectedOutput: example.output,
                actualOutput: result.stdout || '',
                passed: passed,
                executionTime: result.executionTime || 0,
                memoryUsed: result.memoryUsed || 0,
                error: result.error || null,
                explanation: example.explanation
              } as ExampleResult;
            }),
            catchError(error => {
              return of({
                exampleId: example.id,
                input: example.input,
                expectedOutput: example.output,
                actualOutput: '',
                passed: false,
                executionTime: 0,
                memoryUsed: 0,
                error: error.message || 'Execution failed',
                explanation: example.explanation
              } as ExampleResult);
            })
          )
        );

        // Combine all results using forkJoin as fallback
        return forkJoin(executionObservables).pipe(
          map(results => {
            const passedCount = results.filter(r => r.passed).length;
            const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
            const maxMemory = Math.max(...results.map(r => r.memoryUsed));
            
            let overallStatus: 'success' | 'partial' | 'failure';
            if (passedCount === results.length) {
              overallStatus = 'success';
            } else if (passedCount > 0) {
              overallStatus = 'partial';
            } else {
              overallStatus = 'failure';
            }
            
            return {
              results,
              overallStatus,
              passedCount,
              totalCount: results.length,
              averageExecutionTime: results.length > 0 ? Math.round(totalExecutionTime / results.length) : 0,
              maxMemoryUsed: maxMemory
            } as BatchExampleResult;
          })
        );
      })
    );
  }
}
