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
@Component({
  selector: 'app-chat-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-main.component.html',
  styleUrl: './chat-main.component.css',
})
export class ChatMainComponent implements OnChanges, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  @Input() room!: ChatRoom;
  @Input() messages: ChatMessage[] = [];
  @Input() currentUser!: User;
  @Input() roomMembers: User[] = [];
  @Input() reactions: ChatReaction[] = [];
  @Input() typingUsers: User[] = [];
  @Input() isRoomAdmin = false;
  @Input() getUser!: (id: number) => User | undefined;
  @Input() getMessageReactions!: (messageId: number) => ChatReaction[];

  @Output() sendMessage = new EventEmitter<string>();
  @Output() reactToMessage = new EventEmitter<{
    messageId: number;
    reactionType: string;
  }>();

  newMessage = '';
  replyToMessage: ChatMessage | null = null;
  showReactionPicker: number | null = null;
  showMembers = false;
  showSettings = false;
  shouldScrollToBottom = true;

  reactionEmojis = [
    { type: 'like', emoji: '👍', name: 'Thích' },
    { type: 'love', emoji: '❤️', name: 'Yêu thích' },
    { type: 'laugh', emoji: '😂', name: 'Cười' },
    { type: 'sad', emoji: '😢', name: 'Buồn' },
    { type: 'angry', emoji: '😠', name: 'Giận dữ' },
  ];

  ngOnChanges(): void {
    if (this.shouldScrollToBottom) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
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
    const atBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    this.shouldScrollToBottom = atBottom;
  }

  send(): void {
    console.log('📨 ChatMain: send() method called');
    console.log('💬 NewMessage content:', this.newMessage);
    
    if (!this.newMessage.trim()) {
      console.log('⚠️ ChatMain: Empty message, returning');
      return;
    }

    const messageContent = this.newMessage.trim();
    console.log('🚀 ChatMain: Emitting sendMessage event with content:', messageContent);

    // If replying, include reply context (in a real app, this would be handled by the backend)
    this.sendMessage.emit(messageContent);
    console.log('✅ ChatMain: Message emitted to parent component');

    this.newMessage = '';
    this.replyToMessage = null;
    this.shouldScrollToBottom = true;

    // Reset textarea height
    setTimeout(() => {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = '44px';
    });
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
      element.scrollTop = element.scrollHeight;
    }
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
