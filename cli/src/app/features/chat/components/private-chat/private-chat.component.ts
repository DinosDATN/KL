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
import { ChatService } from '../../../../core/services/chat.service';
import { FriendshipService } from '../../../../core/services/friendship.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

  // File upload state
  selectedFile: File | null = null;
  previewImageUrl: string | null = null;
  isUploading = false;

  // Simplified scroll tracking
  shouldScrollToBottom = true;
  showNewMessageIndicator = false;
  newMessageCount = 0;
  isLoadingOlderMessages = false;
  hasMoreMessages = true;
  previousScrollHeight = 0;

  // Simple scroll state
  private isUserNearBottom = true;
  private messageCountOnLastCheck = 0;

  // Typing management
  private typingTimer: any;

  private destroy$ = new Subject<void>();

  constructor(
    private privateChatService: PrivateChatService,
    private chatService: ChatService,
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
          const previousLength = this.messageCountOnLastCheck;
          this.messages = newMessages;
          this.messageCountOnLastCheck = newMessages.length;

          // Check if new messages were added
          if (newMessages.length > previousLength && previousLength > 0) {
            const lastMessage = newMessages[newMessages.length - 1];
            const isMyMessage = lastMessage.sender_id === this.currentUser?.id;

            // Always scroll for user's own messages or when user is near bottom
            if (isMyMessage || this.isUserNearBottom) {
              this.shouldScrollToBottom = true;
              this.resetNewMessageIndicator();
              // Mark new messages as read if user is viewing them
              setTimeout(() => {
                this.markNewMessagesAsReadIfViewing();
              }, 100);
            } else {
              // Show indicator if user scrolled up and received a message from someone else
              this.showNewMessageIndicator = true;
              this.newMessageCount++;
            }
          } else if (previousLength === 0 && newMessages.length > 0) {
            // First time loading conversation - always scroll to bottom
            this.shouldScrollToBottom = true;
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
    // Simple: if we need to scroll, scroll (unless loading older messages)
    if (this.shouldScrollToBottom && !this.isLoadingOlderMessages) {
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
    // Reset message count when loading a new conversation
    this.messageCountOnLastCheck = 0;
    this.shouldScrollToBottom = true;

    this.privateChatService.loadConversationMessages(conversationId).subscribe({
      next: (messages) => {
        // Messages are now handled by the messages$ observable subscription
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
    if (!this.activeConversation || !this.isUserNearBottom) return;

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

    // If there's a file, upload it first
    if (this.selectedFile) {
      this.sendFile();
      return;
    }

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
          // Always scroll when user sends a message
          this.shouldScrollToBottom = true;
          this.isUserNearBottom = true;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;

      // Preview image if it's an image file
      const imageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (imageTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewImageUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.previewImageUrl = null;
      }
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.previewImageUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  sendFile(): void {
    if (!this.selectedFile || !this.activeConversation) {
      return;
    }

    this.isUploading = true;
    this.chatService.uploadFile(this.selectedFile).subscribe({
      next: (fileData) => {
        console.log('✅ File uploaded:', fileData);

        // Send message with file
        this.privateChatService.sendMessageWithFile(
          this.activeConversation!.id,
          this.newMessage.trim() || '',
          fileData.file_url,
          fileData.file_name,
          fileData.file_size,
          fileData.type
        );

        // Reset state
        this.newMessage = '';
        this.selectedFile = null;
        this.previewImageUrl = null;
        this.isUploading = false;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }

        // Always scroll when user sends a message
        this.shouldScrollToBottom = true;
        this.isUserNearBottom = true;
        this.resetNewMessageIndicator();

        // Stop typing indicator
        this.stopTypingIndicator();

        // Reset textarea height
        setTimeout(() => {
          const textarea = this.messageInput.nativeElement;
          textarea.style.height = '44px';
        });
      },
      error: (error) => {
        console.error('❌ Error uploading file:', error);
        this.isUploading = false;
        alert('Lỗi khi tải file lên. Vui lòng thử lại.');
      },
    });
  }

  openFileSelector(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toUpperCase() || '';
  }

  getFileUrl(fileUrl: string | null | undefined): string {
    if (!fileUrl) return '';
    const baseUrl = environment.production
      ? environment.apiUrl
      : 'http://localhost:3000';
    return baseUrl + fileUrl;
  }

  openFileInNewTab(fileUrl: string | null | undefined): void {
    if (fileUrl) {
      window.open(this.getFileUrl(fileUrl), '_blank');
    }
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

    // Track if user is near bottom (simplified)
    this.isUserNearBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;

    // Hide new message indicator if user scrolled to bottom
    if (this.isUserNearBottom && this.showNewMessageIndicator) {
      this.resetNewMessageIndicator();
      // Mark messages as read when user scrolls to view them
      this.markNewMessagesAsReadIfViewing();
    }

    // Handle loading older messages (future feature)
    const nearTop = element.scrollTop <= topThreshold;
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
    this.isUserNearBottom = true;
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
    if (this.typingUsers.length === 1) {
      this.shouldScrollToBottom = true;
      return `${this.typingUsers[0].name} đang nhập...`;
    }
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
