import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseStats } from '../../../../../core/services/admin-course.service';

@Component({
  selector: 'app-course-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-stats.component.html',
  styleUrl: './course-stats.component.css'
})
export class CourseStatsComponent {
  @Input() stats: CourseStats | null = null;
  @Input() loading = false;

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  getStatusColor(type: string): string {
    const colors = {
      total: 'text-blue-600 dark:text-blue-400',
      published: 'text-green-600 dark:text-green-400',
      draft: 'text-yellow-600 dark:text-yellow-400',
      archived: 'text-purple-600 dark:text-purple-400',
      deleted: 'text-red-600 dark:text-red-400',
      premium: 'text-indigo-600 dark:text-indigo-400',
      free: 'text-gray-600 dark:text-gray-400',
      revenue: 'text-emerald-600 dark:text-emerald-400',
      students: 'text-orange-600 dark:text-orange-400',
      rating: 'text-amber-600 dark:text-amber-400'
    };
    return colors[type as keyof typeof colors] || colors.total;
  }

  getStatusIcon(type: string): string {
    const icons = {
      total: 'book',
      published: 'check-circle',
      draft: 'edit',
      archived: 'archive',
      deleted: 'trash',
      premium: 'star',
      free: 'gift',
      revenue: 'dollar-sign',
      students: 'users',
      rating: 'star'
    };
    return icons[type as keyof typeof icons] || icons.total;
  }
}
