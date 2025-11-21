import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentStats } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-document-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-stats.component.html',
  styleUrl: './document-stats.component.css',
})
export class DocumentStatsComponent {
  @Input() stats: DocumentStats | null = null;
  @Input() loading = false;

  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  getStatusColor(type: string): string {
    const colors = {
      total: 'text-blue-600 dark:text-blue-400',
      published: 'text-green-600 dark:text-green-400',
      deleted: 'text-red-600 dark:text-red-400',
      students: 'text-orange-600 dark:text-orange-400',
      rating: 'text-amber-600 dark:text-amber-400',
    };
    return colors[type as keyof typeof colors] || colors.total;
  }

  getStatusIcon(type: string): string {
    const icons = {
      total: 'file-text',
      published: 'check-circle',
      deleted: 'trash',
      students: 'users',
      rating: 'star',
    };
    return icons[type as keyof typeof icons] || icons.total;
  }
}

