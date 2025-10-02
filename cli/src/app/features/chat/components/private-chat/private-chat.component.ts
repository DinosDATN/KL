import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PrivateChatService } from '../../../../core/services/private-chat.service';
import { FriendshipService } from '../../../../core/services/friendship.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  PrivateConversation,
  PrivateMessage,
} from '../../../../core/models/private-chat.model';
import { FriendRequest } from '../../../../core/models/friendship.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './private-chat.component.html',
  styleUrl: './private-chat.component.css',
})
export class PrivateChatComponent
  implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  conversations: PrivateConversation[] = [];
  activeConversation: PrivateConversation | null = null;
  messages: PrivateMessage[] = [];
  friends: FriendRequest[] = [];
  typingUsers: User[] = [];
  newMessage = '';
  currentUser: User | null = null;
  loading = false;
  selectedFriend: User | null = null;
  showFriendsList = false;

  // Modern UI features
  shouldScrollToBottom = true;
  isNearBottom = true;
  showNewMessageIndicator = false;
  newMessageCount = 0;
  isLoadingOlderMessages = false;
  hasMoreMessages = true;
  previousScrollHeight = 0;

  // Typing management
  private typingTimer: any;

  private destroy$ = new Subject<void>();

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
      .subscribe((conversations) => {
        this.conversations = conversations;
      });

    // Subscribe to active conversation
    this.privateChatService.activeConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversation) => {
        this.activeConversation = conversation;
        if (conversation) {
          this.loadConversationMessages(conversation.id);
        } else {
          this.messages = [];
        }
      });

    // Subscribe to real-time message updates
    this.privateChatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messagesMap) => {
        if (this.activeConversation) {
          const newMessages = messagesMap[this.activeConversation.id] || [];
          const previousLength = this.messages.length;
          this.messages = newMessages;

          // Check if new messages were added
          if (newMessages.length > previousLength && previousLength > 0) {
            const lastMessage = newMessages[newMessages.length - 1];

            // If user is at bottom or near bottom, auto-scroll and mark as read
            if (this.isNearBottom) {
              this.shouldScrollToBottom = true;
              // Mark new messages as read if user is viewing them
              setTimeout(() => {
                this.markNewMessagesAsReadIfViewing();
              }, 100);
            } else {
              // Show new message indicator if user is not at bottom
              if (lastMessage.sender_id !== this.currentUser?.id) {
                this.showNewMessageIndicator = true;
                this.newMessageCount++;
              }
            }
          }
        }
      });

    // Subscribe to friends
    this.friendshipService.friends$
      .pipe(takeUntil(this.destroy$))
      .subscribe((friends) => {
        this.friends = friends;
      });

    // Subscribe to typing users
    this.privateChatService.typingUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((typingUsersMap) => {
        if (this.activeConversation) {
          this.typingUsers = typingUsersMap[this.activeConversation.id] || [];
        }
      });
  }

  ngAfterViewChecked(): void {
    // Only auto-scroll to bottom for new messages, not when loading older ones
    if (
      this.shouldScrollToBottom &&
      this.isNearBottom &&
      !this.isLoadingOlderMessages
    ) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up typing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    // Stop typing indicator if active
    if (this.activeConversation) {
      this.privateChatService.stopTyping(this.activeConversation.id);
    }

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
      },
    });

    friends$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading friends:', error);
        this.loading = false;
      },
    });
  }

  private loadConversationMessages(conversationId: number): void {
    this.privateChatService.loadConversationMessages(conversationId).subscribe({
      next: (messages) => {
        // Messages are now handled by the messages$ observable subscription
        this.shouldScrollToBottom = true;
        this.markMessagesAsRead(conversationId);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      },
    });
  }

  private markMessagesAsRead(conversationId: number): void {
    const unreadMessages = this.messages.filter(
      (msg) =>
        msg.sender_id !== this.currentUser?.id && msg.read_status !== 'read'
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg.id);
      this.privateChatService
        .markMessagesAsRead(conversationId, messageIds)
        .subscribe();
    }
  }

  private markNewMessagesAsReadIfViewing(): void {
    if (!this.activeConversation || !this.isNearBottom) return;

    const unreadMessages = this.messages.filter(
      (msg) =>
        msg.sender_id !== this.currentUser?.id && msg.read_status !== 'read'
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg.id);
      this.privateChatService
        .markMessagesAsRead(this.activeConversation.id, messageIds)
        .subscribe();
    }
  }

  onSelectConversation(conversation: PrivateConversation): void {
    this.privateChatService.setActiveConversation(conversation);
    this.showFriendsList = false;
  }

  onSelectFriend(friendReq: FriendRequest): void {
    const friend = friendReq.friend;
    const existingConversation =
      this.privateChatService.findConversationByParticipant(friend.id);

    if (existingConversation) {
      this.onSelectConversation(existingConversation);
    } else {
      this.privateChatService.getOrCreateConversation(friend.id).subscribe({
        next: (conversation) => {
          this.privateChatService.setActiveConversation(conversation);
          this.showFriendsList = false;
        },
        error: (error) => {
          console.error('Error creating conversation:', error);
        },
      });
    }
  }

  // Modern message sending with typing indicators
  send(): void {
    console.log('📨 PrivateChat: send() method called');
    console.log('💬 NewMessage content:', this.newMessage);

    if (!this.activeConversation || !this.newMessage.trim()) {
      console.log(
        '⚠️ PrivateChat: Empty message or no active conversation, returning'
      );
      return;
    }

    const messageContent = this.newMessage.trim();
    console.log('🚀 PrivateChat: Sending message:', messageContent);

    this.privateChatService
      .sendMessage(this.activeConversation.id, messageContent)
      .subscribe({
        next: () => {
          console.log('✅ PrivateChat: Message sent successfully');
          this.messages = this.privateChatService.getMessagesForConversation(
            this.activeConversation!.id
          );
          this.shouldScrollToBottom = true;
          this.isNearBottom = true;
          this.resetNewMessageIndicator();

          // Stop typing indicator
          this.stopTypingIndicator();
        },
        error: (error) => {
          console.error('Error sending message:', error);
          // Restore message text on error
          this.newMessage = messageContent;
        },
      });

    this.newMessage = '';

    // Reset textarea height
    setTimeout(() => {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = '44px';
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  onInputChange(): void {
    // Auto-resize textarea
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

    // Handle typing indicators
    if (this.activeConversation && this.newMessage.trim()) {
      this.startTypingIndicator();
    } else {
      this.stopTypingIndicator();
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

  // Scroll handling methods
  onScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // pixels from bottom
    const topThreshold = 100; // pixels from top for loading older messages

    const atBottom =
      element.scrollHeight - element.scrollTop <=
      element.clientHeight + threshold;
    const nearTop = element.scrollTop <= topThreshold;

    this.isNearBottom = atBottom;

    // Handle bottom scroll behavior
    if (atBottom) {
      this.resetNewMessageIndicator();
      this.shouldScrollToBottom = true;
      // Mark messages as read when user scrolls to view them
      this.markNewMessagesAsReadIfViewing();
    } else {
      this.shouldScrollToBottom = false;
    }

    // Handle top scroll behavior for loading older messages (future feature)
    if (
      nearTop &&
      !this.isLoadingOlderMessages &&
      this.hasMoreMessages &&
      this.messages.length > 0
    ) {
      // this.loadOlderMessages(); // Future implementation
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  scrollToBottomInstant(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // New message indicator methods
  resetNewMessageIndicator(): void {
    this.showNewMessageIndicator = false;
    this.newMessageCount = 0;
  }

  onNewMessageIndicatorClick(): void {
    this.scrollToBottom();
    this.resetNewMessageIndicator();
    this.isNearBottom = true;
  }

  // Typing indicator methods
  private startTypingIndicator(): void {
    if (!this.activeConversation) return;

    // Clear existing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    // Start typing
    this.privateChatService.startTyping(this.activeConversation.id);

    // Set timer to stop typing after 3 seconds of inactivity
    this.typingTimer = setTimeout(() => {
      this.stopTypingIndicator();
    }, 3000);
  }

  private stopTypingIndicator(): void {
    if (!this.activeConversation) return;

    // Clear timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }

    // Stop typing
    this.privateChatService.stopTyping(this.activeConversation.id);
  }

  // Message and UI utility methods
  getGroupedMessages(): { date: string; messages: PrivateMessage[] }[] {
    if (!this.activeConversation) return [];
    return this.privateChatService.getGroupedMessages(
      this.activeConversation.id
    );
  }

  getMessageTime(message: PrivateMessage): string {
    return this.privateChatService.getMessageTime(message);
  }

  getUserInitials(name: string): string {
    return this.privateChatService.getUserInitials(name);
  }

  getSender(message: PrivateMessage): User | undefined {
    return message.Sender;
  }

  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1)
      return `${this.typingUsers[0].name} đang nhập...`;
    return `${this.typingUsers[0].name} và ${this.typingUsers.length - 1
      } người khác đang nhập...`;
  }

  // Track by functions for ngFor optimization
  trackByConversationId(
    index: number,
    conversation: PrivateConversation
  ): number {
    return conversation.id;
  }

  trackByFriendId(index: number, friendReq: FriendRequest): number {
    return friendReq.friend.id;
  }

  trackByMessageId(index: number, message: PrivateMessage): number {
    return message.id;
  }

  trackByDate(
    index: number,
    group: { date: string; messages: PrivateMessage[] }
  ): string {
    return group.date;
  }

  // UI control methods
  toggleFriendsList(): void {
    this.showFriendsList = !this.showFriendsList;
  }

  getOnlineStatus(user: User): boolean {
    return user.is_online || false;
  }
}
