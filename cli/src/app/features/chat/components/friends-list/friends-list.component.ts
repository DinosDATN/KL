import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FriendshipService } from '../../../../core/services/friendship.service';
import { PrivateChatService } from '../../../../core/services/private-chat.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FriendRequest, FriendshipStatus } from '../../../../core/models/friendship.model';
import { User } from '../../../../core/models/user.model';
import { PrivateConversation } from '../../../../core/models/private-chat.model';

@Component({
  selector: 'app-friends-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friends-list.component.html',
  styleUrl: './friends-list.component.css'
})
export class FriendsListComponent implements OnInit, OnDestroy {
  @Output() startPrivateChat = new EventEmitter<User>();

  friends: FriendRequest[] = [];
  searchTerm = '';
  filteredFriends: FriendRequest[] = [];
  loading = false;
  currentUser: User | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private friendshipService: FriendshipService,
    private privateChatService: PrivateChatService,
    public themeService: ThemeService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadFriends();
    
    // Subscribe to friends updates
    this.friendshipService.friends$
      .pipe(takeUntil(this.destroy$))
      .subscribe(friends => {
        this.friends = friends;
        this.filterFriends();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFriends(): void {
    this.loading = true;
    this.friendshipService.loadFriends(1, 100)
      .subscribe({
        next: () => {
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading friends:', error);
          this.loading = false;
        }
      });
  }

  onSearchChange(): void {
    this.filterFriends();
  }

  private filterFriends(): void {
    if (!this.searchTerm.trim()) {
      this.filteredFriends = [...this.friends];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredFriends = this.friends.filter(friendReq => {
        const friend = friendReq.friend;
        return friend.name.toLowerCase().includes(term) || 
               friend.email.toLowerCase().includes(term);
      });
    }
  }

  onStartChat(friend: User): void {
    // Check if conversation already exists
    const existingConversation = this.privateChatService.findConversationByParticipant(friend.id);
    
    if (existingConversation) {
      this.privateChatService.setActiveConversation(existingConversation);
      this.startPrivateChat.emit(friend);
    } else {
      // Create new conversation
      this.privateChatService.getOrCreateConversation(friend.id)
        .subscribe({
          next: (conversation) => {
            this.privateChatService.setActiveConversation(conversation);
            this.startPrivateChat.emit(friend);
          },
          error: (error) => {
            console.error('Error creating conversation:', error);
          }
        });
    }
  }

  onRemoveFriend(friend: User): void {
    if (confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${friend.name}?`)) {
      this.friendshipService.removeFriend(friend.id)
        .subscribe({
          next: () => {
            // Friend will be removed from the list automatically via the service
          },
          error: (error) => {
            console.error('Error removing friend:', error);
          }
        });
    }
  }

  onBlockUser(friend: User): void {
    const reason = prompt(`Lý do chặn ${friend.name} (tùy chọn):`);
    if (reason !== null) { // User didn't cancel
      this.friendshipService.blockUser(friend.id, reason || undefined)
        .subscribe({
          next: () => {
            // User will be removed from friends list automatically
          },
          error: (error) => {
            console.error('Error blocking user:', error);
          }
        });
    }
  }

  getOnlineStatus(friend: User): string {
    if (friend.is_online) {
      return 'Đang trực tuyến';
    }
    
    if (friend.last_seen_at) {
      const lastSeen = new Date(friend.last_seen_at);
      const now = new Date();
      const diffMs = now.getTime() - lastSeen.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffHours < 1) {
        return 'Vừa truy cập';
      } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
      } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
      } else {
        return 'Lâu rồi không truy cập';
      }
    }
    
    return 'Chưa xác định';
  }

  refreshFriends(): void {
    this.loadFriends();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    const button = event.target as HTMLElement;
    const dropdownId = button.getAttribute('data-dropdown-id');
    const dropdown = document.getElementById(`dropdown-${dropdownId}`);
    
    if (dropdown) {
      // Close all other dropdowns first
      const allDropdowns = document.querySelectorAll('[id^="dropdown-friend-"]');
      allDropdowns.forEach(dd => {
        if (dd !== dropdown) {
          dd.classList.add('hidden');
        }
      });
      
      // Toggle current dropdown
      dropdown.classList.toggle('hidden');
    }
    
    // Close dropdown when clicking outside
    if (!dropdown?.classList.contains('hidden')) {
      const closeDropdown = (e: Event) => {
        if (dropdown && !dropdown.contains(e.target as Node) && !button.contains(e.target as Node)) {
          dropdown.classList.add('hidden');
          document.removeEventListener('click', closeDropdown);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeDropdown);
      }, 0);
    }
  }
}
