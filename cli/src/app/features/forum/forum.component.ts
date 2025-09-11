import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Models
import {
  ChatRoom,
  ChatMessage,
  ChatRoomMember,
  ChatReaction,
} from '../../core/models/chat.model';
import { User } from '../../core/models/user.model';

// Services and Data
import { ThemeService } from '../../core/services/theme.service';
import {
  mockChatRooms,
  mockChatMessages,
  mockChatRoomMembers,
  mockChatReactions,
} from '../../core/services/chat-mock-data';
import { mockUsers } from '../../core/services/user-mock-data';

// Components
import { ChatSidebarComponent } from './components/chat-sidebar/chat-sidebar.component';
import { ChatMainComponent } from './components/chat-main/chat-main.component';
import { CreateGroupModalComponent } from './components/create-group-modal/create-group-modal.component';
import { ForumLayoutComponent } from './components/forum-layout/forum-layout.component';
import { PostCreatorComponent } from './components/post-creator/post-creator.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';

interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: number;
  tags: number[];
  isQuestion: boolean;
  attachments?: File[];
}

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChatSidebarComponent,
    ChatMainComponent,
    CreateGroupModalComponent,
    ForumLayoutComponent,
    PostCreatorComponent,
    PostDetailComponent,
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.css',
})
export class ForumComponent implements OnInit, OnDestroy {
  // Data
  chatRooms: ChatRoom[] = [];
  messages: ChatMessage[] = [];
  users: User[] = [];
  roomMembers: ChatRoomMember[] = [];
  reactions: ChatReaction[] = [];

  // Current state
  selectedRoom: ChatRoom | null = null;
  currentUser: User;
  onlineUsers: User[] = [];

  // UI State
  isMobileView = false;
  showSidebar = true;
  showCreateGroupModal = false;
  isTyping = false;
  typingUsers: User[] = [];
  
  // New Forum UI State
  currentView: 'forum' | 'chat' = 'forum';
  viewMode: 'list' | 'post' = 'list';
  selectedPostId: number | null = null;
  showPostCreator = false;

  // Search and filters
  searchTerm = '';
  activeFilter: 'all' | 'unread' | 'favorites' = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    public themeService: ThemeService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Set current user (in real app, this would come from auth service)
    this.currentUser = mockUsers[0];
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkScreenSize();
    // Chỉ chạy realtime simulation ở trình duyệt
    if (isPlatformBrowser(this.platformId)) {
      this.setupRealtimeSimulation();
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }

  private loadInitialData(): void {
    // Load mock data
    this.chatRooms = [...mockChatRooms];
    this.messages = [...mockChatMessages];
    this.users = [...mockUsers];
    this.roomMembers = [...mockChatRoomMembers];
    this.reactions = [...mockChatReactions];

    // Filter online users
    this.onlineUsers = this.users.filter((user) => user.is_online);

    // Auto-select first room if available
    if (this.chatRooms.length > 0) {
      this.selectRoom(this.chatRooms[0]);
    }
  }

  private setupRealtimeSimulation(): void {
    // Simulate real-time typing indicators
    setInterval(() => {
      if (Math.random() < 0.1) {
        // 10% chance
        this.simulateTyping();
      }
    }, 3000);

    // Simulate new messages occasionally
    setInterval(() => {
      if (Math.random() < 0.05) {
        // 5% chance
        this.simulateNewMessage();
      }
    }, 10000);

    // Simulate online status changes
    setInterval(() => {
      if (Math.random() < 0.1) {
        // 10% chance
        this.simulateOnlineStatusChange();
      }
    }, 15000);
  }

  private simulateTyping(): void {
    const availableUsers = this.users.filter(
      (u) => u.id !== this.currentUser.id
    );
    const typingUser =
      availableUsers[Math.floor(Math.random() * availableUsers.length)];

    if (!this.typingUsers.includes(typingUser)) {
      this.typingUsers.push(typingUser);

      // Remove after 2-5 seconds
      setTimeout(() => {
        this.typingUsers = this.typingUsers.filter(
          (u) => u.id !== typingUser.id
        );
      }, 2000 + Math.random() * 3000);
    }
  }

  private simulateNewMessage(): void {
    if (!this.selectedRoom) return;

    const availableUsers = this.users.filter(
      (u) => u.id !== this.currentUser.id
    );
    const sender =
      availableUsers[Math.floor(Math.random() * availableUsers.length)];

    const sampleMessages = [
      'Chào mọi người! 👋',
      'Có ai online không?',
      'Mình vừa hoàn thành bài tập!',
      'Cần hỗ trợ một chút về phần này',
      'Thanks mọi người đã giúp đỡ! 🙏',
      'Hẹn gặp lại vào buổi học tới',
      'Ai đã xem video mới chưa?',
      'Có link tài liệu không ạ?',
    ];

    const newMessage: ChatMessage = {
      id: Date.now(),
      room_id: this.selectedRoom.id,
      sender_id: sender.id,
      content:
        sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
      time_stamp: new Date().toISOString(),
      type: 'text',
      is_edited: false,
      sent_at: new Date().toISOString(),
    };

    this.messages.push(newMessage);

    // Update room's last message and unread count
    const room = this.chatRooms.find((r) => r.id === this.selectedRoom!.id);
    if (room) {
      room.last_message_id = newMessage.id;
      room.unread_count += 1;
      room.updated_at = new Date().toISOString();
    }
  }

  private simulateOnlineStatusChange(): void {
    const user = this.users[Math.floor(Math.random() * this.users.length)];
    if (user.id === this.currentUser.id) return;

    user.is_online = !user.is_online;
    user.last_seen_at = new Date().toISOString();

    // Update online users list
    this.onlineUsers = this.users.filter((u) => u.is_online);
  }

  // Event Handlers
  onSelectRoom(room: ChatRoom): void {
    this.selectRoom(room);

    // Hide sidebar on mobile after selection
    if (this.isMobileView) {
      this.showSidebar = false;
    }
  }

  onSendMessage(content: string): void {
    if (!this.selectedRoom || !content.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      room_id: this.selectedRoom.id,
      sender_id: this.currentUser.id,
      content: content.trim(),
      time_stamp: new Date().toISOString(),
      type: 'text',
      is_edited: false,
      sent_at: new Date().toISOString(),
    };

    this.messages.push(newMessage);

    // Update room's last message
    const room = this.chatRooms.find((r) => r.id === this.selectedRoom!.id);
    if (room) {
      room.last_message_id = newMessage.id;
      room.updated_at = new Date().toISOString();
    }
  }

  onReactToMessage(messageId: number, reactionType: string): void {
    const existingReaction = this.reactions.find(
      (r) => r.message_id === messageId && r.user_id === this.currentUser.id
    );

    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // Remove reaction
        this.reactions = this.reactions.filter(
          (r) => r.id !== existingReaction.id
        );
      } else {
        // Update reaction
        existingReaction.reaction_type = reactionType as any;
        existingReaction.reacted_at = new Date().toISOString();
      }
    } else {
      // Add new reaction
      const newReaction: ChatReaction = {
        id: Date.now(),
        message_id: messageId,
        user_id: this.currentUser.id,
        reaction_type: reactionType as any,
        reacted_at: new Date().toISOString(),
      };
      this.reactions.push(newReaction);
    }
  }

  onCreateGroup(): void {
    this.showCreateGroupModal = true;
  }

  onGroupCreated(groupData: {
    name: string;
    description: string;
    isPublic: boolean;
    selectedUsers: User[];
  }): void {
    const newRoom: ChatRoom = {
      id: Date.now(),
      name: groupData.name,
      type: 'group',
      description: groupData.description,
      avatar_url: null,
      unread_count: 0,
      last_message_id: null,
      is_public: groupData.isPublic,
      created_by: this.currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.chatRooms.unshift(newRoom);

    // Add members
    const members: ChatRoomMember[] = [
      {
        id: Date.now(),
        room_id: newRoom.id,
        user_id: this.currentUser.id,
        joined_at: new Date().toISOString(),
        is_admin: true,
      },
      ...groupData.selectedUsers.map((user, index) => ({
        id: Date.now() + index + 1,
        room_id: newRoom.id,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        is_admin: false,
      })),
    ];

    this.roomMembers.push(...members);
    this.selectRoom(newRoom);
    this.showCreateGroupModal = false;
  }

  onCloseModal(): void {
    this.showCreateGroupModal = false;
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  private selectRoom(room: ChatRoom): void {
    this.selectedRoom = room;

    // Mark room as read
    room.unread_count = 0;
  }

  private onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth < 768;
      if (!this.isMobileView) {
        this.showSidebar = true;
      }
    }
  }

  // Helper methods
  getRoomMessages(roomId: number): ChatMessage[] {
    return this.messages
      .filter((m) => m.room_id === roomId)
      .sort(
        (a, b) =>
          new Date(a.time_stamp).getTime() - new Date(b.time_stamp).getTime()
      );
  }

  getUser(userId: number): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  getRoomMembers(roomId: number): User[] {
    const memberIds = this.roomMembers
      .filter((m) => m.room_id === roomId)
      .map((m) => m.user_id);

    return this.users.filter((u) => memberIds.includes(u.id));
  }

  getMessageReactions(messageId: number): ChatReaction[] {
    return this.reactions.filter((r) => r.message_id === messageId);
  }

  isRoomAdmin(roomId: number, userId: number): boolean {
    const member = this.roomMembers.find(
      (m) => m.room_id === roomId && m.user_id === userId
    );
    return member?.is_admin || false;
  }

  getFilteredRooms(): ChatRoom[] {
    let filtered = this.chatRooms;

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(term) ||
          room.description?.toLowerCase().includes(term)
      );
    }

    // Apply active filter
    switch (this.activeFilter) {
      case 'unread':
        filtered = filtered.filter((room) => room.unread_count > 0);
        break;
      case 'favorites':
        // In a real app, this would filter by user favorites
        filtered = filtered.filter((room) => room.type === 'group');
        break;
    }

    // Sort by last activity
    return filtered.sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });
  }

  // New Forum Methods
  openPostCreator(): void {
    this.showPostCreator = true;
  }

  closePostCreator(): void {
    this.showPostCreator = false;
  }

  onPostCreated(postRequest: CreatePostRequest): void {
    console.log('New post created:', postRequest);
    // Here you would normally send the post to your backend service
    // this.forumService.createPost(postRequest).subscribe(...);
    
    // For demo purposes, just log and close modal
    this.closePostCreator();
  }

  viewPost(postId: number): void {
    this.selectedPostId = postId;
    this.viewMode = 'post';
  }

  backToForum(): void {
    this.viewMode = 'list';
    this.selectedPostId = null;
  }


  navigateToCategory(categoryId: number): void {
    console.log('Navigate to category:', categoryId);
    // Implement category filtering
  }
}
