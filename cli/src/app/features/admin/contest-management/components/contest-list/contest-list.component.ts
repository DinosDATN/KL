import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminContest } from '../../../../../core/services/admin.service';

@Component({
  selector: 'app-contest-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contest-list.component.html',
  styleUrl: './contest-list.component.css',
})
export class ContestListComponent implements OnChanges {
  @Input() contests: AdminContest[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() selectedContestIds: number[] = [];
  @Input() sortBy: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Input() currentPage = 1;
  @Input() itemsPerPage = 10;
  @Input() totalItems = 0;
  @Input() totalPages = 1;
  @Input() showDeletedActions = false;

  @Output() contestToggle = new EventEmitter<{
    contestId: number;
    selected: boolean;
  }>();
  @Output() selectAll = new EventEmitter<boolean>();
  @Output() viewContest = new EventEmitter<AdminContest>();
  @Output() editContest = new EventEmitter<AdminContest>();
  @Output() deleteContest = new EventEmitter<number>();
  @Output() restoreContest = new EventEmitter<number>();
  @Output() permanentlyDeleteContest = new EventEmitter<number>();
  @Output() manageProblems = new EventEmitter<AdminContest>();
  @Output() manageParticipants = new EventEmitter<AdminContest>();
  @Output() sortChange = new EventEmitter<{
    sortBy: string;
    order: 'asc' | 'desc';
  }>();
  @Output() pageChange = new EventEmitter<number>();

  // Expose Math for template
  Math = Math;

  selectAllChecked = false;

  onSelectAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectAllChecked = target.checked;
    this.selectAll.emit(this.selectAllChecked);
  }

  onContestToggle(contestId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.contestToggle.emit({ contestId, selected: target.checked });
  }

  updateSelectAllState(): void {
    this.selectAllChecked =
      this.contests.length > 0 &&
      this.contests.every((c) => this.selectedContestIds.includes(c.id));
  }

  isContestSelected(contestId: number): boolean {
    return this.selectedContestIds.includes(contestId);
  }

  onSort(field: string): void {
    const newOrder =
      this.sortBy === field && this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ sortBy: field, order: newOrder });
  }

  onView(contest: AdminContest): void {
    this.viewContest.emit(contest);
  }

  onEdit(contest: AdminContest): void {
    this.editContest.emit(contest);
  }

  onDelete(contestId: number): void {
    this.deleteContest.emit(contestId);
  }

  onRestore(contestId: number): void {
    this.restoreContest.emit(contestId);
  }

  onPermanentlyDelete(contestId: number): void {
    this.permanentlyDeleteContest.emit(contestId);
  }

  onManageProblems(contest: AdminContest): void {
    this.manageProblems.emit(contest);
  }

  onManageParticipants(contest: AdminContest): void {
    this.manageParticipants.emit(contest);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusColor(status: string): string {
    const colors = {
      upcoming:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      active:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      completed:
        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return (
      colors[status as keyof typeof colors] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    );
  }

  getStatusLabel(status: string): string {
    const labels = {
      upcoming: 'Sắp tới',
      active: 'Đang diễn ra',
      completed: 'Đã kết thúc',
    };
    return labels[status as keyof typeof labels] || status;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contests'] || changes['selectedContestIds']) {
      this.updateSelectAllState();
    }
  }
}

