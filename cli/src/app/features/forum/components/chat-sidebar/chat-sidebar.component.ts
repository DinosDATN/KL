import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatRoom } from '../../../../core/models/chat.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.css',
})
export class ChatSidebarComponent {
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.style.display = 'none';
    }
  }
  @Input() rooms: ChatRoom[] = [];
  @Input() selectedRoom: ChatRoom | null = null;
  @Input() currentUser!: User;
  @Input() onlineUsers: User[] = [];
  @Input() searchTerm: string = '';
  @Input() activeFilter: 'all' | 'unread' | 'favorites' = 'all';
  @Input() getUser!: (id: number) => User | undefined;
  @Input() getRoomMembers!: (roomId: number) => User[];

  @Output() roomSelected = new EventEmitter<ChatRoom>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() filterChanged = new EventEmitter<'all' | 'unread' | 'favorites'>();
  @Output() createGroup = new EventEmitter<void>();

  filters = [
    { key: 'all' as const, label: 'Tất cả' },
    { key: 'unread' as const, label: 'Chưa đọc' },
    { key: 'favorites' as const, label: 'Yêu thích' },
  ];

  selectRoom(room: ChatRoom): void {
    this.roomSelected.emit(room);
  }

  onSearchChange(event: any): void {
    this.searchChanged.emit(event.target.value);
  }

  trackByRoomId(index: number, room: ChatRoom): number {
    return room.id;
  }

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

  getLastMessage(room: ChatRoom): string {
    // This would typically fetch the actual last message
    // For now, we'll return a placeholder
    return '';
  }

  getLastActivityTime(room: ChatRoom): string {
    if (!room.updated_at) return '';

    const now = new Date();
    const updated = new Date(room.updated_at);
    const diffInMinutes = Math.floor(
      (now.getTime() - updated.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes}p`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return updated.toLocaleDateString('vi-VN');
  }

  getOnlineMembersCount(room: ChatRoom): number {
    // Use the preloaded online_member_count if available
    if (room.online_member_count !== undefined) {
      return room.online_member_count;
    }
    // Fallback to calculating from members list
    const members = this.getRoomMembers(room.id);
    return members.filter((member) => member.is_online).length;
  }
}
