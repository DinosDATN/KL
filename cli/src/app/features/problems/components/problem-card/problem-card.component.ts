import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Problem } from '../../../../core/models/problem.model';

@Component({
  selector: 'app-problem-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './problem-card.component.html',
  styleUrl: './problem-card.component.css'
})
export class ProblemCardComponent {
  @Input() problem!: Problem;
  @Input() categoryName: string = '';
  @Input() tagNames: string[] = [];
  
  @Output() problemView = new EventEmitter<Problem>();
  
  constructor(private router: Router) {}
  
  onViewClick(): void {
    this.problemView.emit(this.problem);
    this.router.navigate(['/problems', this.problem.id]);
  }
  
  getDifficultyClass(): string {
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
