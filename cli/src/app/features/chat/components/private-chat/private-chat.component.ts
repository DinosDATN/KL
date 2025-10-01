import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PrivateChatService } from '../../../../core/services/private-chat.service';
import { FriendshipService } from '../../../../core/services/friendship.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PrivateConversation, PrivateMessage } from '../../../../core/models/private-chat.model';
import { FriendRequest } from '../../../../core/models/friendship.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './private-chat.component.html',
  styleUrl: './private-chat.component.css'
})
export class PrivateChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  conversations: PrivateConversation[] = [];
  activeConversation: PrivateConversation | null = null;
  messages: PrivateMessage[] = [];
  friends: FriendRequest[] = [];
  newMessage = '';
  currentUser: User | null = null;
  loading = false;
  selectedFriend: User | null = null;
  showFriendsList = false;
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    private privateChatService: PrivateChatService,
    private friendshipService: FriendshipService,
    public themeService: ThemeService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadData();
    
    // Subscribe to conversations
    this.privateChatService.conversations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversations => {
        this.conversations = conversations;
      });
    
    // Subscribe to active conversation
    this.privateChatService.activeConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversation => {
        this.activeConversation = conversation;
        if (conversation) {
          this.loadConversationMessages(conversation.id);
        }
      });
    
    // Subscribe to friends
    this.friendshipService.friends$
      .pipe(takeUntil(this.destroy$))
      .subscribe(friends => {
        this.friends = friends;
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading = true;
    
    const conversations$ = this.privateChatService.loadConversations();
    const friends$ = this.friendshipService.loadFriends();
    
    conversations$.subscribe({
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.loading = false;
      }
    });
    
    friends$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading friends:', error);
        this.loading = false;
      }
    });
  }

  private loadConversationMessages(conversationId: number): void {
    this.privateChatService.loadConversationMessages(conversationId)
      .subscribe({
        next: (messages) => {
          this.messages = this.privateChatService.getMessagesForConversation(conversationId);
          this.shouldScrollToBottom = true;
          this.markMessagesAsRead(conversationId);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
        }
      });
  }

  private markMessagesAsRead(conversationId: number): void {
    const unreadMessages = this.messages.filter(msg => 
      msg.sender_id !== this.currentUser?.id && msg.read_status !== 'read'
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      this.privateChatService.markMessagesAsRead(conversationId, messageIds)
        .subscribe();
    }
  }

  onSelectConversation(conversation: PrivateConversation): void {
    this.privateChatService.setActiveConversation(conversation);
    this.showFriendsList = false;
  }

  onSelectFriend(friendReq: FriendRequest): void {
    const friend = friendReq.friend;
    const existingConversation = this.privateChatService.findConversationByParticipant(friend.id);
    
    if (existingConversation) {
      this.onSelectConversation(existingConversation);
    } else {
      this.privateChatService.getOrCreateConversation(friend.id)
        .subscribe({
          next: (conversation) => {
            this.privateChatService.setActiveConversation(conversation);
            this.showFriendsList = false;
          },
          error: (error) => {
            console.error('Error creating conversation:', error);
          }
        });
    }
  }

  onSendMessage(): void {
    if (!this.activeConversation || !this.newMessage.trim()) {
      return;
    }

    const content = this.newMessage.trim();
    this.newMessage = '';
    
    this.privateChatService.sendMessage(this.activeConversation.id, content)
      .subscribe({
        next: () => {
          this.messages = this.privateChatService.getMessagesForConversation(this.activeConversation!.id);
          this.shouldScrollToBottom = true;
        },
        error: (error) => {
          console.error('Error sending message:', error);
          // Restore message text on error
          this.newMessage = content;
        }
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
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

  getConversationTitle(conversation: PrivateConversation): string {
    return conversation.other_participant?.name || 'Cuộc trò chuyện';
  }

  getConversationSubtitle(conversation: PrivateConversation): string {
    if (conversation.last_message) {
      const msg = conversation.last_message;
      const prefix = msg.sender_id === this.currentUser?.id ? 'Bạn: ' : '';
      return prefix + (msg.content || 'Tin nhắn');
    }
    return 'Bắt đầu cuộc trò chuyện';
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  toggleFriendsList(): void {
    this.showFriendsList = !this.showFriendsList;
  }

  getOnlineStatus(user: User): boolean {
    return user.is_online || false;
  }
}
