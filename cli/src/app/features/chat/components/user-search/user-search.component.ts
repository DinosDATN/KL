import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { FriendshipService } from '../../../../core/services/friendship.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FriendSearchResult, FriendshipStatus } from '../../../../core/models/friendship.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-search.component.html',
  styleUrl: './user-search.component.css'
})
export class UserSearchComponent implements OnInit, OnDestroy {
  searchTerm = '';
  searchResults: FriendSearchResult[] = [];
  loading = false;
  currentUser: User | null = null;
  noResults = false;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private friendshipService: FriendshipService,
    public themeService: ThemeService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(term => {
        if (!term || term.length < 2) {
          return of([]);
        }
        this.loading = true;
        this.noResults = false;
        return this.friendshipService.searchUsersWithStatus(term);
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.noResults = results.length === 0 && this.searchTerm.length >= 2;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.searchResults = [];
        this.noResults = true;
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm.trim());
  }

  onSendFriendRequest(user: FriendSearchResult): void {
    this.friendshipService.sendFriendRequest(user.id)
      .subscribe({
        next: () => {
          // Update the user's friendship status locally
          if (user.friendship_status) {
            user.friendship_status.status = 'pending';
            user.friendship_status.isRequester = true;
          }
        },
        error: (error) => {
          console.error('Error sending friend request:', error);
        }
      });
  }

  onAcceptFriendRequest(user: FriendSearchResult): void {
    // Find the friendship ID - this would need to be included in the search results
    // For now, we'll need to fetch the friendship status to get the ID
    this.friendshipService.getFriendshipStatus(user.id)
      .subscribe({
        next: (status) => {
          if (status.status === 'pending' && !status.isRequester) {
            // This is a received friend request, we can accept it
            // We need the friendship ID which isn't available in the current API response
            // This would require enhancing the API to return friendship details
            console.log('Accepting friend request would require friendship ID');
          }
        },
        error: (error) => {
          console.error('Error getting friendship status:', error);
        }
      });
  }

  getStatusText(user: FriendSearchResult): string {
    if (!user.friendship_status) {
      return '';
    }

    const status = user.friendship_status;
    switch (status.status) {
      case 'none':
        return '';
      case 'pending':
        return status.isRequester ? 'Đã gửi lời mời' : 'Đã gửi cho bạn lời mời';
      case 'accepted':
        return 'Đã là bạn bè';
      case 'declined':
        return 'Đã từ chối';
      case 'blocked':
        return 'Đã chặn';
      case 'self':
        return 'Đây là bạn';
      default:
        return '';
    }
  }

  getStatusClass(user: FriendSearchResult): string {
    if (!user.friendship_status) {
      return '';
    }

    const status = user.friendship_status;
    switch (status.status) {
      case 'pending':
        return status.isRequester ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'self':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
      default:
        return '';
    }
  }

  canSendFriendRequest(user: FriendSearchResult): boolean {
    return !user.friendship_status || user.friendship_status.status === 'none';
  }

  canAcceptFriendRequest(user: FriendSearchResult): boolean {
    return user.friendship_status?.status === 'pending' && !user.friendship_status.isRequester;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.noResults = false;
  }
}
