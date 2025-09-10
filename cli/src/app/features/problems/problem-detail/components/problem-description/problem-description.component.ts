import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Problem } from '../../../../../core/models/problem.model';

@Component({
  selector: 'app-problem-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './problem-description.component.html',
  styleUrl: './problem-description.component.css'
})
export class ProblemDescriptionComponent {
  @Input() problem: Problem | null = null;
  @Input() categoryName: string = '';
  @Input() tagNames: string[] = [];
  
  getDifficultyClass(): string {
    if (!this.problem) return '';
    
    switch (this.problem.difficulty) {
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
  
  getDifficultyLabel(): string {
    if (!this.problem) return '';
    
    switch (this.problem.difficulty) {
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
