import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ChatRoom,
  ChatMessage,
  ChatReaction,
} from '../../../../core/models/chat.model';
import { User } from '../../../../core/models/user.model';
import {
  ChatSettingsModalComponent,
  ChatSettings,
  MemberAction,
} from '../chat-settings-modal/chat-settings-modal.component';
import { ChatService } from '../../../../core/services/chat.service';
import { environment } from '../../../../../environments/environment';

export const environmentApiUrl = environment;
@Component({
  selector: 'app-chat-main',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatSettingsModalComponent],
  templateUrl: './chat-main.component.html',
  styleUrl: './chat-main.component.css',
})
export class ChatMainComponent implements OnChanges, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() room!: ChatRoom;
  @Input() messages: ChatMessage[] = [];
  @Input() currentUser!: User;
  @Input() roomMembers: User[] = [];
  @Input() reactions: ChatReaction[] = [];
  @Input() typingUsers: User[] = [];
  @Input() isRoomAdmin = false;
  @Input() allUsers: User[] = [];
  @Input() getUser!: (id: number) => User | undefined;
  @Input() getMessageReactions!: (messageId: number) => ChatReaction[];

  @Output() sendMessage = new EventEmitter<string>();
  @Output() reactToMessage = new EventEmitter<{
    messageId: number;
    reactionType: string;
  }>();
  @Output() updateChatSettings = new EventEmitter<ChatSettings>();
  @Output() handleMemberAction = new EventEmitter<MemberAction>();
  @Output() deleteRoom = new EventEmitter<number>();
  @Output() leaveRoom = new EventEmitter<number>();
  @Output() loadOlderMessages = new EventEmitter<void>();

  // Inputs for pagination state from parent
  @Input() set isLoadingOlderMessagesProp(value: boolean) {
    // This is managed by computed getter now
  }
  @Input() set hasMoreMessagesProp(value: boolean) {
    // This is managed by computed getter now
  }
  @Input() set paginationCallbacks(callbacks: {
    isLoading: (roomId: number) => boolean;
    hasMore: (roomId: number) => boolean;
  }) {
    if (callbacks) {
      this.isLoadingPagination = callbacks.isLoading;
      this.hasMorePagination = callbacks.hasMore;
    }
  }

  newMessage = '';
  replyToMessage: ChatMessage | null = null;
  showReactionPicker: number | null = null;
  showMembers = false;
  showSettings = false;
  showChatSettingsModal = false;
  shouldScrollToBottom = true;
  showNewMessageIndicator = false;
  newMessageCount = 0;
  previousScrollHeight = 0;

  // File upload state
  selectedFile: File | null = null;
  previewImageUrl: string | null = null;
  isUploading = false;
  environment = environment;

  // Simplified scroll tracking
  private isUserNearBottom = true;
  private messageCountOnLastCheck = 0;

  // Pagination state - will be managed by parent component
  get isLoadingOlderMessages(): boolean {
    return this.room ? this.isLoadingPagination(this.room.id) : false;
  }

  get hasMoreMessages(): boolean {
    return this.room ? this.hasMorePagination(this.room.id) : true;
  }

  // Callbacks for pagination state from parent
  private isLoadingPagination = (roomId: number): boolean => false;
  private hasMorePagination = (roomId: number): boolean => true;

  reactionEmojis = [
    { type: 'like', emoji: '👍', name: 'Thích' },
    { type: 'love', emoji: '❤️', name: 'Yêu thích' },
    { type: 'laugh', emoji: '😂', name: 'Cười' },
    { type: 'sad', emoji: '😢', name: 'Buồn' },
    { type: 'angry', emoji: '😠', name: 'Giận dữ' },
  ];

  ngOnChanges(): void {
    // Simple logic: if new messages were added, decide whether to scroll
    if (this.messages && this.messages.length > this.messageCountOnLastCheck) {
      const isNewMessage = this.messageCountOnLastCheck > 0; // Skip first load
      this.messageCountOnLastCheck = this.messages.length;

      if (isNewMessage) {
        const lastMessage = this.messages[this.messages.length - 1];
        const isMyMessage = lastMessage.sender_id === this.currentUser.id;

        // Always scroll for user's own messages or when user is near bottom
        if (isMyMessage || this.isUserNearBottom) {
          this.shouldScrollToBottom = true;
          this.resetNewMessageIndicator();
        } else {
          // Show indicator if user scrolled up and received a message from someone else
          this.showNewMessageIndicator = true;
          this.newMessageCount++;
        }
      } else {
        // First time loading conversation - always scroll to bottom
        this.shouldScrollToBottom = true;
      }

      // Handle older messages being loaded (maintain scroll position)
      if (
        this.room &&
        this.isLoadingPagination(this.room.id) &&
        this.messagesContainer
      ) {
        setTimeout(() => this.maintainScrollPositionAfterLoad(), 50);
      }
    }
  }

  ngAfterViewChecked(): void {
    // Simple: if we need to scroll, scroll (unless loading older messages)
    if (this.shouldScrollToBottom && !this.isLoadingOlderMessages) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
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
  }

  onScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // pixels from bottom
    const topThreshold = 100; // pixels from top for loading older messages

    // Track if user is near bottom (simplified)
    this.isUserNearBottom =
      element.scrollHeight - element.scrollTop <=
      element.clientHeight + threshold;

    // Hide new message indicator if user scrolled to bottom
    if (this.isUserNearBottom && this.showNewMessageIndicator) {
      this.resetNewMessageIndicator();
    }

    // Handle loading older messages
    const nearTop = element.scrollTop <= topThreshold;
    if (
      nearTop &&
      !this.isLoadingOlderMessages &&
      this.hasMoreMessages &&
      this.messages.length > 0
    ) {
      this.loadOlderMessagesHandler();
    }
  }

  constructor(private chatService: ChatService) {}

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

  send(): void {
    console.log('📨 ChatMain: send() method called');
    console.log('💬 NewMessage content:', this.newMessage);

    // If there's a file, upload it first
    if (this.selectedFile) {
      this.sendFile();
      return;
    }

    if (!this.newMessage.trim()) {
      console.log('⚠️ ChatMain: Empty message, returning');
      return;
    }

    const messageContent = this.newMessage.trim();
    console.log(
      '🚀 ChatMain: Emitting sendMessage event with content:',
      messageContent
    );

    // If replying, include reply context (in a real app, this would be handled by the backend)
    this.sendMessage.emit(messageContent);
    console.log('✅ ChatMain: Message emitted to parent component');

    this.newMessage = '';
    this.replyToMessage = null;
    // Always scroll when user sends a message
    this.shouldScrollToBottom = true;
    this.isUserNearBottom = true;
    this.resetNewMessageIndicator();

    // Reset textarea height
    setTimeout(() => {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = '44px';
    });
  }

  sendFile(): void {
    if (!this.selectedFile || !this.room) {
      return;
    }

    this.isUploading = true;
    this.chatService.uploadFile(this.selectedFile).subscribe({
      next: (fileData) => {
        console.log('✅ File uploaded:', fileData);

        // Send message with file
        // For images, don't send filename as content unless user typed something
        const messageContent = fileData.type === 'image' 
          ? (this.newMessage.trim() || '') 
          : (this.newMessage.trim() || fileData.file_name || '');
          
        this.chatService.sendMessage(
          this.room.id,
          messageContent,
          fileData.type,
          this.replyToMessage?.id,
          fileData.file_url,
          fileData.file_name,
          fileData.file_size
        );

        // Reset state
        this.newMessage = '';
        this.selectedFile = null;
        this.previewImageUrl = null;
        this.replyToMessage = null;
        this.isUploading = false;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }

        // Always scroll when user sends a message
        this.shouldScrollToBottom = true;
        this.isUserNearBottom = true;
        this.resetNewMessageIndicator();

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

  setReplyTo(message: ChatMessage): void {
    this.replyToMessage = message;
    this.messageInput.nativeElement.focus();
  }

  cancelReply(): void {
    this.replyToMessage = null;
  }

  addReaction(messageId: number, reactionType: string): void {
    this.reactToMessage.emit({ messageId, reactionType });
    this.showReactionPicker = null;
  }

  toggleReaction(messageId: number, reactionType: string): void {
    this.reactToMessage.emit({ messageId, reactionType });
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

  // Settings modal methods
  openChatSettings(): void {
    this.showChatSettingsModal = true;
  }

  closeChatSettings(): void {
    this.showChatSettingsModal = false;
  }

  onChatSettingsUpdate(settings: ChatSettings): void {
    this.updateChatSettings.emit(settings);
  }

  onMemberAction(action: MemberAction): void {
    this.handleMemberAction.emit(action);
  }

  onDeleteRoom(roomId: number): void {
    this.deleteRoom.emit(roomId);
  }

  onLeaveRoom(roomId: number): void {
    this.leaveRoom.emit(roomId);
  }

  // Pagination Methods
  private loadOlderMessagesHandler(): void {
    if (this.isLoadingOlderMessages || !this.hasMoreMessages) {
      return;
    }

    console.log('📜 Loading older messages...');

    // Store current scroll position to maintain it after loading
    if (this.messagesContainer) {
      this.previousScrollHeight =
        this.messagesContainer.nativeElement.scrollHeight;
    }

    // Emit event to parent component to load older messages
    this.loadOlderMessages.emit();
  }

  private maintainScrollPositionAfterLoad(): void {
    if (this.messagesContainer && this.previousScrollHeight > 0) {
      const element = this.messagesContainer.nativeElement;
      const newScrollHeight = element.scrollHeight;
      const heightDifference = newScrollHeight - this.previousScrollHeight;

      // Maintain scroll position by adjusting scrollTop
      element.scrollTop = element.scrollTop + heightDifference;

      console.log('📍 Scroll position maintained after loading older messages');
    }

    // Reset scroll height tracking
    this.previousScrollHeight = 0;
  }

  // Called by parent when older messages are loaded
  onOlderMessagesLoaded(): void {
    // maintainScrollPositionAfterLoad will be called automatically through ngOnChanges
    // Pagination state is now managed by parent component
  }

  // Called by parent when no more older messages are available
  onNoMoreOlderMessages(): void {
    // Pagination state is now managed by parent component
  }

  // Helper Methods
  getRoomInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getRoomTypeClass(type: string): string {
    switch (type) {
      case 'course':
        return 'bg-yellow-500 text-white';
      case 'global':
        return 'bg-blue-500 text-white';
      case 'group':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  getMemberCount(): number {
    // Use preloaded member count if available
    if (this.room?.member_count !== undefined) {
      return this.room.member_count;
    }
    // Fallback to roomMembers array length
    return this.roomMembers.length;
  }

  getOnlineCount(): number {
    // Use preloaded online count if available
    if (this.room?.online_member_count !== undefined) {
      return this.room.online_member_count;
    }
    // Fallback to calculating from roomMembers
    return this.roomMembers.filter((member) => member.is_online).length;
  }

  getSender(message: ChatMessage): User | undefined {
    return this.getUser(message.sender_id);
  }

  getReplyToMessage(messageId: number): ChatMessage | undefined {
    return this.messages.find((m) => m.id === messageId);
  }

  getReplyToSender(messageId: number): User | undefined {
    const message = this.getReplyToMessage(messageId);
    return message ? this.getUser(message.sender_id) : undefined;
  }

  getMessageTime(message: ChatMessage): string {
    const now = new Date();
    const messageTime = new Date(message.time_stamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - messageTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ`;

    return messageTime.toLocaleString('vi-VN');
  }

  getGroupedMessages(): { date: string; messages: ChatMessage[] }[] {
    const groups: { [key: string]: ChatMessage[] } = {};

    this.messages.forEach((message) => {
      const date = new Date(message.time_stamp).toLocaleDateString('vi-VN');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  }

  getGroupedReactions(messageId: number): { type: string; count: number }[] {
    const reactions = this.getMessageReactions(messageId);
    const groups: { [key: string]: number } = {};

    reactions.forEach((reaction) => {
      groups[reaction.reaction_type] =
        (groups[reaction.reaction_type] || 0) + 1;
    });

    return Object.entries(groups).map(([type, count]) => ({ type, count }));
  }

  getReactionEmoji(type: string): string {
    const emoji = this.reactionEmojis.find((e) => e.type === type);
    return emoji ? emoji.emoji : '👍';
  }

  getTypingText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1)
      return `${this.typingUsers[0].name} đang nhập...`;
    if (this.typingUsers.length === 2)
      return `${this.typingUsers[0].name} và ${this.typingUsers[1].name} đang nhập...`;
    return `${this.typingUsers[0].name} và ${
      this.typingUsers.length - 1
    } người khác đang nhập...`;
  }

  // Track by functions
  trackByDate(
    index: number,
    group: { date: string; messages: ChatMessage[] }
  ): string {
    return group.date;
  }

  trackByMessageId(index: number, message: ChatMessage): number {
    return message.id;
  }

  trackByReactionType(
    index: number,
    reaction: { type: string; count: number }
  ): string {
    return reaction.type;
  }

}
