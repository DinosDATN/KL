import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminContest,
  AdminService,
  ContestParticipant,
  PaginationInfo,
} from '../../../../../core/services/admin.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-contest-participants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contest-participants.component.html',
  styleUrl: './contest-participants.component.css',
})
export class ContestParticipantsComponent implements OnInit, OnChanges {
  @Input() contest: AdminContest | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() participantsUpdated = new EventEmitter<void>();

  participants: ContestParticipant[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  pagination: PaginationInfo | null = null;

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadParticipants();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contest'] && this.contest) {
      this.currentPage = 1;
      this.loadParticipants();
    }
  }

  loadParticipants(): void {
    if (!this.contest) return;

    this.loading = true;
    this.adminService
      .getContestParticipants(this.contest.id, {
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchTerm || undefined,
        sortBy: 'joined_at',
        sortOrder: 'DESC',
      })
      .subscribe({
        next: (response) => {
          this.participants = response.participants;
          this.pagination = response.pagination;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.total_pages;
          this.totalItems = response.pagination.total_items;
          this.itemsPerPage = response.pagination.items_per_page;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading participants:', error);
          this.notificationService.error(
            'Lỗi',
            'Không thể tải danh sách thí sinh'
          );
          this.loading = false;
          this.participants = [];
        },
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadParticipants();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadParticipants();
  }

  removeParticipant(userId: number): void {
    if (!this.contest) return;

    if (
      !confirm(
        'Bạn có chắc chắn muốn xóa thí sinh này khỏi cuộc thi? Hành động này không thể hoàn tác.'
      )
    ) {
      return;
    }

    this.adminService
      .removeParticipantFromContest(this.contest.id, userId)
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Thành công',
            'Đã xóa thí sinh khỏi cuộc thi'
          );
          this.loadParticipants();
          this.participantsUpdated.emit();
        },
        error: (error) => {
          this.notificationService.error(
            'Lỗi',
            error.error?.message || 'Không thể xóa thí sinh'
          );
        },
      });
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

  onClose(): void {
    this.close.emit();
  }

  // Expose Math for template
  Math = Math;
}

