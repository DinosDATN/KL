import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Contest } from '../../../../../core/models/contest.model';
import { ContestService } from '../../../../../core/services/contest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

interface Participant {
  id: number;
  contest_id: number;
  user_id: number;
  joined_at: string;
  User?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

@Component({
  selector: 'app-creator-contest-participants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './creator-contest-participants.component.html',
  styleUrls: ['./creator-contest-participants.component.css'],
})
export class CreatorContestParticipantsComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() contest: Contest | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() participantsUpdated = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  participants: Participant[] = [];
  filteredParticipants: Participant[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 20;

  constructor(
    private contestService: ContestService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.contest) {
      this.loadParticipants();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contest'] && this.contest) {
      this.loadParticipants();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadParticipants(): void {
    if (!this.contest) {
      return;
    }

    this.loading = true;
    this.contestService
      .getContestParticipants(this.contest.id, this.currentPage, this.itemsPerPage)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.participants = response.data as Participant[];
            this.filterParticipants();
            if (response.pagination) {
              this.currentPage = response.pagination.current_page;
              this.totalPages = response.pagination.total_pages;
              this.totalItems = response.pagination.total_items;
              this.itemsPerPage = response.pagination.items_per_page;
            }
          } else {
            this.participants = [];
            this.filteredParticipants = [];
          }
        },
        error: (error) => {
          console.error('Error loading participants:', error);
          this.notificationService.error(
            'Lỗi',
            'Không thể tải danh sách thí sinh'
          );
          this.participants = [];
          this.filteredParticipants = [];
        },
      });
  }

  filterParticipants(): void {
    if (!this.searchTerm.trim()) {
      this.filteredParticipants = this.participants;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredParticipants = this.participants.filter(
      (participant) =>
        participant.User?.name?.toLowerCase().includes(term) ||
        participant.User?.email?.toLowerCase().includes(term)
    );
  }

  onSearch(): void {
    // Filter participants on current page (client-side filtering)
    this.filterParticipants();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadParticipants();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  removeParticipant(participant: Participant): void {
    if (!participant.User) {
      return;
    }

    const userName = participant.User.name || participant.User.email || 'thí sinh này';
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa "${userName}" khỏi cuộc thi "${this.contest?.title}"?`
      )
    ) {
      return;
    }

    if (!this.contest) {
      return;
    }

    this.loading = true;
    this.contestService
      .removeParticipantFromContest(this.contest.id, participant.user_id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success(
              'Thành công',
              'Đã xóa thí sinh khỏi cuộc thi thành công'
            );
            // Reload participants list
            this.loadParticipants();
            // Emit event to update parent component
            this.participantsUpdated.emit();
          } else {
            this.notificationService.error(
              'Lỗi',
              response.message || 'Không thể xóa thí sinh'
            );
          }
        },
        error: (error) => {
          console.error('Error removing participant:', error);
          this.notificationService.error(
            'Lỗi',
            error.error?.message || 'Không thể xóa thí sinh khỏi cuộc thi'
          );
        },
      });
  }

  canRemoveParticipant(): boolean {
    if (!this.contest) {
      return false;
    }
    // Only allow removal from upcoming contests
    const now = new Date();
    const startTime = new Date(this.contest.start_time);
    return startTime > now;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  exportParticipants(): void {
    if (this.participants.length === 0) {
      this.notificationService.warning(
        'Cảnh báo',
        'Không có dữ liệu để xuất'
      );
      return;
    }

    // Create CSV content
    const headers = ['STT', 'Tên', 'Email', 'Ngày đăng ký'];
    const rows = this.participants.map((p, index) => [
      index + 1,
      p.User?.name || 'N/A',
      p.User?.email || 'N/A',
      this.formatDate(p.joined_at),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `danh-sach-thi-sinh-${this.contest?.title || 'contest'}-${new Date().getTime()}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success(
      'Thành công',
      'Đã xuất danh sách thí sinh thành công'
    );
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPages, 5);
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }
}

