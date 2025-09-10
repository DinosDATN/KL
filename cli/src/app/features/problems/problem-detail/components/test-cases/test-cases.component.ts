import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestCase } from '../../../../../core/models/problem.model';

@Component({
  selector: 'app-test-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-cases.component.html',
  styleUrl: './test-cases.component.css'
})
export class TestCasesComponent {
  @Input() testCases: TestCase[] = [];
  
  showAddForm = false;
  editingTestCase: TestCase | null = null;
  
  newTestCase: Partial<TestCase> = {
    input: '',
    expected_output: '',
    is_sample: true
  };
  
  showAddTestCase(): void {
    this.showAddForm = true;
    this.editingTestCase = null;
    this.resetNewTestCase();
  }
  
  editTestCase(testCase: TestCase): void {
    this.editingTestCase = testCase;
    this.showAddForm = true;
    this.newTestCase = { ...testCase };
  }
  
  saveTestCase(): void {
    if (!this.newTestCase.input?.trim() || !this.newTestCase.expected_output?.trim()) {
      return;
    }
    
    if (this.editingTestCase) {
      // Update existing test case
      const index = this.testCases.findIndex(tc => tc.id === this.editingTestCase!.id);
      if (index !== -1) {
        this.testCases[index] = {
          ...this.editingTestCase,
          ...this.newTestCase
        } as TestCase;
      }
    } else {
      // Add new test case
      const newId = Math.max(...this.testCases.map(tc => tc.id), 0) + 1;
      this.testCases.push({
        id: newId,
        problem_id: this.testCases[0]?.problem_id || 1,
        input: this.newTestCase.input!,
        expected_output: this.newTestCase.expected_output!,
        is_sample: this.newTestCase.is_sample || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    this.cancelEdit();
  }
  
  deleteTestCase(testCase: TestCase): void {
    if (confirm('Bạn có chắc chắn muốn xóa test case này?')) {
      const index = this.testCases.findIndex(tc => tc.id === testCase.id);
      if (index !== -1) {
        this.testCases.splice(index, 1);
      }
    }
  }
  
  cancelEdit(): void {
    this.showAddForm = false;
    this.editingTestCase = null;
    this.resetNewTestCase();
  }
  
  private resetNewTestCase(): void {
    this.newTestCase = {
      input: '',
      expected_output: '',
      is_sample: true
    };
  }
}
