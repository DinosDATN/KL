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
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
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
  messages: {[roomId: number]: ChatMessage[]} = {};
  users: User[] = [];
  roomMembers: ChatRoomMember[] = [];
  reactions: ChatReaction[] = [];

  // Current state
  selectedRoom: ChatRoom | null = null;
  currentUser: User | null = null;
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
    private chatService: ChatService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Get current user from auth service
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.initializeChat();
    this.checkScreenSize();
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.disconnect();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }

  private initializeChat(): void {
    if (!this.currentUser) {
      console.error('No authenticated user found');
      return;
    }

    // Initialize chat service
    this.chatService.initializeChat();

    // Subscribe to rooms
    this.chatService.getRoomsForCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rooms => {
        this.chatRooms = rooms;
        // Auto-select first room if available and no room is selected
        if (rooms.length > 0 && !this.selectedRoom) {
          this.selectRoom(rooms[0]);
        }
      });

    // Subscribe to online users
    this.chatService.onlineUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.onlineUsers = users;
      });

    // Load mock users for now (until user management is implemented)
    this.users = [...mockUsers];
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
    if (!this.selectedRoom || !content.trim() || !this.currentUser) return;

    // Send message via chat service (Socket.IO)
    this.chatService.sendMessage(this.selectedRoom.id, content.trim());
  }

  onReactToMessage(messageId: number, reactionType: string): void {
    if (!this.currentUser) return;
    
    // Send reaction via chat service (Socket.IO)
    this.chatService.addReaction(messageId, reactionType);
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
    if (!this.currentUser) return;

    // Create room via chat service
    const roomData = {
      name: groupData.name,
      description: groupData.description,
      type: 'group',
      is_public: groupData.isPublic,
      memberIds: groupData.selectedUsers.map(user => user.id)
    };

    this.chatService.createRoom(roomData).subscribe({
      next: (room) => {
        this.selectRoom(room);
        this.showCreateGroupModal = false;
      },
      error: (error) => {
        console.error('Error creating room:', error);
        // You might want to show an error message to the user
      }
    });
  }

  onCloseModal(): void {
    this.showCreateGroupModal = false;
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  private selectRoom(room: ChatRoom): void {
    this.selectedRoom = room;
    
    // Join room via socket
    this.chatService.joinRoom(room.id);
    
    // Load messages for the room
    this.chatService.loadRoomMessages(room.id).subscribe();
    
    // Subscribe to messages for this room
    this.chatService.getMessagesForRoom(room.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages[room.id] = messages;
      });

    // Mark room as read (reset unread count)
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

  // Typing indicators
  onStartTyping(roomId: number): void {
    if (this.selectedRoom && this.selectedRoom.id === roomId) {
      this.chatService.startTyping(roomId);
    }
  }

  onStopTyping(roomId: number): void {
    if (this.selectedRoom && this.selectedRoom.id === roomId) {
      this.chatService.stopTyping(roomId);
    }
  }

  getTypingUsers(roomId: number): User[] {
    // Subscribe to typing users for the selected room
    if (this.selectedRoom && this.selectedRoom.id === roomId) {
      this.chatService.getTypingUsersForRoom(roomId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(users => {
          this.typingUsers = users;
        });
    }
    return this.typingUsers;
  }

  // Helper methods
  getRoomMessages(roomId: number): ChatMessage[] {
    return this.messages[roomId] || [];
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
