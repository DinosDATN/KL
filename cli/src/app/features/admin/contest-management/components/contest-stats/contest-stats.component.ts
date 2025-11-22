import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContestStats } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-contest-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contest-stats.component.html',
  styleUrl: './contest-stats.component.css',
})
export class ContestStatsComponent {
  @Input() stats: ContestStats | null = null;
  @Input() loading = false;

  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  getStatusColor(type: string): string {
    const colors = {
      total: 'text-blue-600 dark:text-blue-400',
      upcoming: 'text-blue-600 dark:text-blue-400',
      active: 'text-green-600 dark:text-green-400',
      completed: 'text-gray-600 dark:text-gray-400',
      participants: 'text-orange-600 dark:text-orange-400',
      submissions: 'text-purple-600 dark:text-purple-400',
      duration: 'text-indigo-600 dark:text-indigo-400',
    };
    return colors[type as keyof typeof colors] || colors.total;
  }

  getStatusIcon(type: string): string {
    const icons = {
      total: 'trophy',
      upcoming: 'clock',
      active: 'play-circle',
      completed: 'check-circle',
      participants: 'users',
      submissions: 'file-text',
      duration: 'clock',
    };
    return icons[type as keyof typeof icons] || icons.total;
  }
}

