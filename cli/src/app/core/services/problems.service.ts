import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
  ProblemComment
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
  constructor() { }

  // Problem operations
  getProblems(): Observable<Problem[]> {
    return of(mockProblems);
  }

  getProblemById(id: number): Observable<Problem | null> {
    const problem = mockProblems.find(p => p.id === id);
    return of(problem || null);
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
    return of(mockProblemCategories);
  }

  getCategoryById(id: number): Observable<ProblemCategory | null> {
    const category = mockProblemCategories.find(c => c.id === id);
    return of(category || null);
  }

  // Tag operations
  getTags(): Observable<Tag[]> {
    return of(mockTags);
  }

  getTagById(id: number): Observable<Tag | null> {
    const tag = mockTags.find(t => t.id === id);
    return of(tag || null);
  }

  getProblemTags(problemId: number): Observable<Tag[]> {
    const problemTagIds = mockProblemTags
      .filter(pt => pt.problem_id === problemId)
      .map(pt => pt.tag_id);
    
    const tags = mockTags.filter(tag => problemTagIds.includes(tag.id));
    return of(tags);
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
    const examples = mockProblemExamples.filter(e => e.problem_id === problemId);
    return of(examples);
  }

  // Problem constraints
  getProblemConstraints(problemId: number): Observable<ProblemConstraint[]> {
    const constraints = mockProblemConstraints.filter(c => c.problem_id === problemId);
    return of(constraints);
  }

  // Starter codes
  getStarterCodes(problemId: number): Observable<StarterCode[]> {
    const codes = mockStarterCodes.filter(sc => sc.problem_id === problemId);
    return of(codes);
  }

  getStarterCodeByLanguage(problemId: number, language: string): Observable<StarterCode | null> {
    const code = mockStarterCodes.find(sc => 
      sc.problem_id === problemId && sc.language === language
    );
    return of(code || null);
  }

  // Test cases
  getTestCases(problemId: number): Observable<TestCase[]> {
    const testCases = mockTestCases.filter(tc => tc.problem_id === problemId);
    return of(testCases);
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

  getPopularProblems(): Observable<Problem[]> {
    const popular = mockProblems
      .filter(p => p.is_popular)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);
    return of(popular);
  }

  getRecentProblems(): Observable<Problem[]> {
    const recent = mockProblems
      .filter(p => p.is_new)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
    return of(recent);
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
}
