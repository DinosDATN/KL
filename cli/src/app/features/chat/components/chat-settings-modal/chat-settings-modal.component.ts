import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ChatRoom, ChatRoomMember } from '../../../../core/models/chat.model';
import { User } from '../../../../core/models/user.model';

export interface ChatSettings {
  roomName?: string;
  description?: string;
  isPrivate?: boolean;
  allowInvites?: boolean;
  muteNotifications?: boolean;
  notificationSound?: string;
  autoDeleteMessages?: boolean;
  autoDeleteDays?: number;
}

export interface MemberAction {
  type: 'add' | 'remove' | 'promote' | 'demote' | 'kick';
  userId: number;
  user?: User;
}

@Component({
  selector: 'app-chat-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-settings-modal.component.html',
  styleUrl: './chat-settings-modal.component.css'
})
export class ChatSettingsModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() room!: ChatRoom;
  @Input() currentUser!: User;
  @Input() roomMembers: User[] = [];
  @Input() isRoomAdmin = false;
  @Input() allUsers: User[] = []; // Available users to add

  @Output() closeModal = new EventEmitter<void>();
  @Output() updateSettings = new EventEmitter<ChatSettings>();
  @Output() memberAction = new EventEmitter<MemberAction>();
  @Output() deleteRoom = new EventEmitter<number>();
  @Output() leaveRoom = new EventEmitter<number>();

  private destroy$ = new Subject<void>();

  // Modal state
  activeTab: 'general' | 'members' | 'notifications' | 'advanced' = 'general';
  showDeleteConfirm = false;
  showLeaveConfirm = false;
  showAddMemberModal = false;

  // Form data
  settings: ChatSettings = {};
  originalSettings: ChatSettings = {};
  
  // Member management
  searchTerm = '';
  filteredUsers: User[] = [];
  selectedUsersToAdd: number[] = [];

  // Notification settings
  notificationSounds = [
    { value: 'default', label: 'Mặc định' },
    { value: 'bell', label: 'Chuông' },
    { value: 'chime', label: 'Tiếng chuông nhỏ' },
    { value: 'none', label: 'Tắt tiếng' }
  ];

  ngOnInit(): void {
    if (this.room) {
      this.initializeSettings();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSettings(): void {
    // Initialize settings from room data
    this.settings = {
      roomName: this.room.name,
      description: this.room.description || '',
      isPrivate: this.room.type === 'group', // Changed from 'private' to match actual room types
      allowInvites: true, // Default value, should come from backend
      muteNotifications: false, // Should come from user preferences
      notificationSound: 'default',
      autoDeleteMessages: false,
      autoDeleteDays: 30
    };
    
    // Keep original settings for comparison
    this.originalSettings = { ...this.settings };
    
    // Initialize filtered users for add member functionality
    this.updateFilteredUsers();
  }

  // Modal Management
  closeModalHandler(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?')) {
        this.closeModal.emit();
      }
    } else {
      this.closeModal.emit();
    }
  }

  // Tab Management
  setActiveTab(tab: string): void {
    this.activeTab = tab as 'general' | 'members' | 'notifications' | 'advanced';
  }

  // Settings Management
  saveSettings(): void {
    if (this.hasUnsavedChanges()) {
      this.updateSettings.emit(this.settings);
      this.originalSettings = { ...this.settings };
    }
  }

  resetSettings(): void {
    this.settings = { ...this.originalSettings };
  }

  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
  }

  // Member Management
  openAddMemberModal(): void {
    this.showAddMemberModal = true;
    this.searchTerm = '';
    this.selectedUsersToAdd = [];
    this.updateFilteredUsers();
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
    this.searchTerm = '';
    this.selectedUsersToAdd = [];
  }

  updateFilteredUsers(): void {
    const currentMemberIds = this.roomMembers.map(member => member.id);
    
    this.filteredUsers = this.allUsers.filter(user => {
      // Don't show current members
      if (currentMemberIds.includes(user.id)) {
        return false;
      }
      
      // Apply search filter
      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase();
        return user.name.toLowerCase().includes(term) ||
               user.email?.toLowerCase().includes(term);
      }
      
      return true;
    }).slice(0, 50); // Limit results for performance
  }

  onSearchChange(): void {
    this.updateFilteredUsers();
  }

  toggleUserSelection(userId: number): void {
    const index = this.selectedUsersToAdd.indexOf(userId);
    if (index > -1) {
      this.selectedUsersToAdd.splice(index, 1);
    } else {
      this.selectedUsersToAdd.push(userId);
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsersToAdd.includes(userId);
  }

  addSelectedMembers(): void {
    this.selectedUsersToAdd.forEach(userId => {
      const user = this.filteredUsers.find(u => u.id === userId);
      if (user) {
        this.memberAction.emit({
          type: 'add',
          userId,
          user
        });
      }
    });
    this.closeAddMemberModal();
  }

  removeMember(userId: number): void {
    if (confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) {
      const user = this.roomMembers.find(u => u.id === userId);
      this.memberAction.emit({
        type: 'remove',
        userId,
        user
      });
    }
  }

  promoteMember(userId: number): void {
    const user = this.roomMembers.find(u => u.id === userId);
    this.memberAction.emit({
      type: 'promote',
      userId,
      user
    });
  }

  demoteMember(userId: number): void {
    const user = this.roomMembers.find(u => u.id === userId);
    this.memberAction.emit({
      type: 'demote',
      userId,
      user
    });
  }

  kickMember(userId: number): void {
    if (confirm('Bạn có chắc muốn kick thành viên này khỏi nhóm?')) {
      const user = this.roomMembers.find(u => u.id === userId);
      this.memberAction.emit({
        type: 'kick',
        userId,
        user
      });
    }
  }

  // Room Management
  confirmDeleteRoom(): void {
    this.showDeleteConfirm = true;
  }

  deleteRoomHandler(): void {
    this.deleteRoom.emit(this.room.id);
    this.showDeleteConfirm = false;
    this.closeModal.emit();
  }

  confirmLeaveRoom(): void {
    this.showLeaveConfirm = true;
  }

  leaveRoomHandler(): void {
    this.leaveRoom.emit(this.room.id);
    this.showLeaveConfirm = false;
    this.closeModal.emit();
  }

  // Helper Methods
  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  isAdmin(user: User): boolean {
    // Check if user is admin - this should come from backend
    return user.id === this.room.created_by || user.role === 'admin';
  }

  canManageMember(user: User): boolean {
    // Current user must be admin and target user must not be the room creator
    return this.isRoomAdmin && 
           user.id !== this.room.created_by && 
           user.id !== this.currentUser.id;
  }

  canPromoteDemote(user: User): boolean {
    // Can only promote/demote if current user is admin and target is not creator
    return this.isRoomAdmin && 
           user.id !== this.room.created_by &&
           user.id !== this.currentUser.id;
  }

  getRoomTypeDisplay(): string {
    switch (this.room.type) {
      case 'global': return 'Nhóm công khai';
      case 'group': return 'Nhóm riêng tư';
      case 'course': return 'Nhóm khóa học';
      default: return 'Nhóm chat';
    }
  }

  getCreatedDate(): string {
    return new Date(this.room.created_at).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Track by functions for ngFor optimization
  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  trackByMemberId(index: number, member: User): number {
    return member.id;
  }
}
