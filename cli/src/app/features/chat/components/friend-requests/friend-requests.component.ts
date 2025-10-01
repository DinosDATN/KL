import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FriendshipService } from '../../../../core/services/friendship.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Friendship } from '../../../../core/models/friendship.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-friend-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-requests.component.html',
  styleUrl: './friend-requests.component.css'
})
export class FriendRequestsComponent implements OnInit, OnDestroy {
  pendingRequests: Friendship[] = [];
  sentRequests: Friendship[] = [];
  activeTab: 'received' | 'sent' = 'received';
  loading = false;
  currentUser: User | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private friendshipService: FriendshipService,
    public themeService: ThemeService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadRequests();
    
    // Subscribe to requests updates
    this.friendshipService.pendingRequests$
      .pipe(takeUntil(this.destroy$))
      .subscribe(requests => {
        this.pendingRequests = requests;
      });
    
    this.friendshipService.sentRequests$
      .pipe(takeUntil(this.destroy$))
      .subscribe(requests => {
        this.sentRequests = requests;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRequests(): void {
    this.loading = true;
    const pendingRequests$ = this.friendshipService.loadPendingRequests();
    const sentRequests$ = this.friendshipService.loadSentRequests();
    
    pendingRequests$.subscribe({
      error: (error) => {
        console.error('Error loading pending requests:', error);
        this.loading = false;
      }
    });
    
    sentRequests$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sent requests:', error);
        this.loading = false;
      }
    });
  }

  onTabChange(tab: 'received' | 'sent'): void {
    this.activeTab = tab;
  }

  onAcceptRequest(friendship: Friendship): void {
    this.friendshipService.respondToFriendRequest(friendship.id, 'accept')
      .subscribe({
        next: () => {
          // Request will be removed from list automatically via service
        },
        error: (error) => {
          console.error('Error accepting friend request:', error);
        }
      });
  }

  onDeclineRequest(friendship: Friendship): void {
    if (confirm(`Bạn có chắc chắn muốn từ chối lời mời kết bạn từ ${friendship.Requester?.name}?`)) {
      this.friendshipService.respondToFriendRequest(friendship.id, 'decline')
        .subscribe({
          next: () => {
            // Request will be removed from list automatically via service
          },
          error: (error) => {
            console.error('Error declining friend request:', error);
          }
        });
    }
  }

  onCancelSentRequest(friendship: Friendship): void {
    if (confirm(`Bạn có chắc chắn muốn hủy lời mời kết bạn gửi tới ${friendship.Addressee?.name}?`)) {
      // Note: This would require a new API endpoint to cancel sent requests
      // For now, we'll show an info message
      alert('Tính năng hủy lời mời sẽ được thêm trong phiên bản tới');
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) {
      return 'Vừa xong';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  }

  refreshRequests(): void {
    this.loadRequests();
  }
}
