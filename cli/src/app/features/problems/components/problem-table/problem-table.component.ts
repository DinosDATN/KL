import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Problem, ProblemCategory, Tag, ProblemTag } from '../../../../core/models/problem.model';

@Component({
  selector: 'app-problem-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './problem-table.component.html',
  styleUrl: './problem-table.component.css'
})
export class ProblemTableComponent {
  @Input() problems: Problem[] = [];
  @Input() categories: ProblemCategory[] = [];
  @Input() tags: Tag[] = [];
  @Input() problemTags: ProblemTag[] = [];
  
  @Output() problemView = new EventEmitter<Problem>();
  
  constructor(private router: Router) {}
  
  onViewClick(problem: Problem): void {
    this.problemView.emit(problem);
    this.router.navigate(['/problems', problem.id]);
  }
  
  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }
  
  getProblemTagNames(problemId: number): string[] {
    const tagIds = this.problemTags
      .filter(pt => pt.problem_id === problemId)
      .map(pt => pt.tag_id);
    
    return tagIds.map(id => {
      const tag = this.tags.find(t => t.id === id);
      return tag ? tag.name : 'Unknown';
    });
  }
  
  getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }
  
  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return 'Dễ';
      case 'Medium':
        return 'Trung bình';
      case 'Hard':
        return 'Khó';
      default:
        return 'Không xác định';
    }
  }
}
