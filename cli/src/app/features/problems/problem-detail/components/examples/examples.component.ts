import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProblemExample } from '../../../../../core/models/problem.model';

@Component({
  selector: 'app-examples',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './examples.component.html',
  styleUrl: './examples.component.css'
})
export class ExamplesComponent {
  @Input() examples: ProblemExample[] = [];
  
  selectedExample: ProblemExample | null = null;
  
  selectExample(example: ProblemExample): void {
    this.selectedExample = this.selectedExample?.id === example.id ? null : example;
  }
  
  isExampleSelected(example: ProblemExample): boolean {
    return this.selectedExample?.id === example.id;
  }
}
