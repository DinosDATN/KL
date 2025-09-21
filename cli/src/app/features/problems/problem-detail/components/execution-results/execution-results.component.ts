import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExecutionResult, SubmissionResult, TestCaseResult } from '../../../../../core/models/problem.model';

@Component({
  selector: 'app-execution-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './execution-results.component.html',
  styleUrl: './execution-results.component.css'
})
export class ExecutionResultsComponent {
  @Input() executionResult: ExecutionResult | null = null;
  @Input() submissionResult: SubmissionResult | null = null;
  @Input() showDetailedResults: boolean = true;

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'accepted': 'text-green-600',
      'wrong': 'text-red-600',
      'error': 'text-red-600',
      'timeout': 'text-yellow-600',
      'pending': 'text-blue-600'
    };
    return colorMap[status] || 'text-gray-600';
  }

  getStatusBgColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'accepted': 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700',
      'wrong': 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700',
      'error': 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700',
      'timeout': 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700',
      'pending': 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700'
    };
    return colorMap[status] || 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700';
  }

  getStatusDisplayText(status: string): string {
    const displayMap: { [key: string]: string } = {
      'accepted': 'Đúng',
      'wrong': 'Sai',
      'error': 'Lỗi',
      'timeout': 'Quá thời gian',
      'pending': 'Đang xử lý'
    };
    return displayMap[status] || status;
  }
}
