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

// Components
import { ChatSidebarComponent } from './components/chat-sidebar/chat-sidebar.component';
import { ChatMainComponent } from './components/chat-main/chat-main.component';
import { CreateGroupModalComponent } from './components/create-group-modal/create-group-modal.component';
import { ChatSettingsModalComponent, ChatSettings, MemberAction } from './components/chat-settings-modal/chat-settings-modal.component';
import { ForumLayoutComponent } from './components/forum-layout/forum-layout.component';
import { PostCreatorComponent } from './components/post-creator/post-creator.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';

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
    ChatSettingsModalComponent,
    ForumLayoutComponent,
    PostCreatorComponent,
    PostDetailComponent,
    NotificationToastComponent,
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
  
  // Pagination state
  messagePagination: { [roomId: number]: { page: number; hasMore: boolean; loading: boolean } } = {};
  
  // New Forum UI State
  currentView: 'forum' | 'chat' = 'forum';
  viewMode: 'list' | 'post' = 'list';
  selectedPostId: number | null = null;
  showPostCreator = false;

  // Search
  searchTerm = '';

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
    
    // Subscribe to authentication state changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          console.log('✅ User authenticated:', user.name);
          // Initialize chat when user becomes available
          this.initializeChat();
        } else {
          console.log('🔑 User not authenticated');
          // Clear chat data when user logs out
          this.clearChatData();
        }
      });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.onResize.bind(this));
    }
    
    // Initialize chat if user is already authenticated
    if (this.currentUser) {
      this.initializeChat();
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
      console.info('🔑 User not authenticated - chat features disabled');
      return;
    }

    // Initialize chat service
    this.chatService.initializeChat();

    // Subscribe to rooms
    this.chatService.getRoomsForCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rooms => {
        this.chatRooms = rooms;
        
        // Load users and room members from the rooms data
        this.loadUsersFromRooms(rooms);
        
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

    // Users will be loaded dynamically from the backend when needed
  }

  private clearChatData(): void {
    // Clear all chat-related data when user logs out
    this.chatRooms = [];
    this.messages = {};
    this.selectedRoom = null;
    this.onlineUsers = [];
    this.roomMembers = [];
    this.reactions = [];
    
    // Disconnect from chat service
    this.chatService.disconnect();
  }

  private loadUsersFromRooms(rooms: ChatRoom[]): void {
    // Extract all users from rooms data (creators, members)
    const allUsers = new Map<number, User>();
    
    rooms.forEach(room => {
      // Add creator
      if (room.Creator) {
        allUsers.set(room.Creator.id, {
          ...room.Creator,
          role: 'user',
          is_active: true,
          subscription_status: 'free',
          subscription_end_date: null,
          created_at: '',
          updated_at: ''
        } as User);
      }
      
      // Add all members
      if (room.all_members) {
        room.all_members.forEach(member => {
          if (member) {
            allUsers.set(member.id, {
              ...member,
              role: member.role || 'user',
              is_active: member.is_active || true,
              subscription_status: member.subscription_status || 'free',
              subscription_end_date: member.subscription_end_date || null,
              created_at: member.created_at || '',
              updated_at: member.updated_at || ''
            } as User);
          }
        });
      }
      
      // Add room members data
      if (room.all_members) {
        room.all_members.forEach(member => {
          if (member) {
            const roomMember: ChatRoomMember = {
              id: 0, // This will be set properly by the backend
              room_id: room.id,
              user_id: member.id,
              joined_at: new Date().toISOString(),
              is_admin: false, // This should come from the backend
              User: member
            };
            
            // Add to roomMembers if not already present
            if (!this.roomMembers.find(rm => rm.room_id === room.id && rm.user_id === member.id)) {
              this.roomMembers.push(roomMember);
            }
          }
        });
      }
    });
    
    // Update users array
    this.users = Array.from(allUsers.values());
  }

  private loadUsersFromMessages(messages: ChatMessage[]): void {
    // Extract users from message senders and add them to the users array if not already present
    const currentUsers = new Map<number, User>();
    
    // Add existing users to map
    this.users.forEach(user => {
      currentUsers.set(user.id, user);
    });
    
    // Add users from messages
    messages.forEach(message => {
      if (message.Sender && !currentUsers.has(message.Sender.id)) {
        currentUsers.set(message.Sender.id, {
          ...message.Sender,
          role: message.Sender.role || 'user',
          is_active: message.Sender.is_active || true,
          subscription_status: message.Sender.subscription_status || 'free',
          subscription_end_date: message.Sender.subscription_end_date || null,
          created_at: message.Sender.created_at || '',
          updated_at: message.Sender.updated_at || null
        } as User);
      }
    });
    
    // Update users array
    this.users = Array.from(currentUsers.values());
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
    console.log('📬 Forum: onSendMessage called');
    console.log('📩 Content:', content);
    console.log('📍 Selected room:', this.selectedRoom?.name);
    console.log('👤 Current user:', this.currentUser?.name);
    
    if (!this.selectedRoom || !content.trim() || !this.currentUser) {
      console.log('⚠️ Cannot send message - missing requirements');
      return;
    }

    // Send message via chat service (Socket.IO)
    this.chatService.sendMessage(this.selectedRoom.id, content.trim());
  }

  onReactToMessage(messageId: number, reactionType: string): void {
    if (!this.currentUser) return;
    
    // Send reaction via chat service (Socket.IO)
    this.chatService.addReaction(messageId, reactionType);
  }

  // Chat Settings Event Handlers
  onUpdateChatSettings(settings: ChatSettings): void {
    if (!this.selectedRoom) return;

    this.chatService.updateRoomSettings(this.selectedRoom.id, settings)
      .subscribe({
        next: (updatedRoom) => {
          console.log('✅ Room settings updated:', updatedRoom.name);
          // Update local room data
          const roomIndex = this.chatRooms.findIndex(r => r.id === this.selectedRoom!.id);
          if (roomIndex !== -1) {
            this.chatRooms[roomIndex] = updatedRoom;
            this.selectedRoom = updatedRoom;
          }
        },
        error: (error) => {
          console.error('❌ Error updating room settings:', error);
        }
      });
  }

  onHandleMemberAction(action: MemberAction): void {
    if (!this.selectedRoom) return;

    switch (action.type) {
      case 'add':
        if (action.user) {
          this.chatService.addMemberToRoom(this.selectedRoom.id, action.userId)
            .subscribe({
              next: () => {
                console.log('✅ Member added:', action.user!.name);
                // Update local members list
                if (!this.roomMembers.find(m => m.user_id === action.userId)) {
                  this.roomMembers.push({
                    id: 0,
                    room_id: this.selectedRoom!.id,
                    user_id: action.userId,
                    joined_at: new Date().toISOString(),
                    is_admin: false,
                    User: action.user!
                  });
                }
              },
              error: (error) => {
                console.error('❌ Error adding member:', error);
              }
            });
        }
        break;

      case 'remove':
      case 'kick':
        this.chatService.removeMemberFromRoom(this.selectedRoom.id, action.userId)
          .subscribe({
            next: () => {
              console.log('✅ Member removed:', action.user?.name);
              // Update local members list
              this.roomMembers = this.roomMembers.filter(m => m.user_id !== action.userId);
            },
            error: (error) => {
              console.error('❌ Error removing member:', error);
            }
          });
        break;

      case 'promote':
        this.chatService.updateMemberRole(this.selectedRoom.id, action.userId, true)
          .subscribe({
            next: () => {
              console.log('✅ Member promoted:', action.user?.name);
              // Update local members list
              const member = this.roomMembers.find(m => m.user_id === action.userId);
              if (member) {
                member.is_admin = true;
              }
            },
            error: (error) => {
              console.error('❌ Error promoting member:', error);
            }
          });
        break;

      case 'demote':
        this.chatService.updateMemberRole(this.selectedRoom.id, action.userId, false)
          .subscribe({
            next: () => {
              console.log('✅ Member demoted:', action.user?.name);
              // Update local members list
              const member = this.roomMembers.find(m => m.user_id === action.userId);
              if (member) {
                member.is_admin = false;
              }
            },
            error: (error) => {
              console.error('❌ Error demoting member:', error);
            }
          });
        break;
    }
  }

  onDeleteRoom(roomId: number): void {
    this.chatService.deleteRoom(roomId)
      .subscribe({
        next: () => {
          console.log('✅ Room deleted');
          // Room will be removed from local state by the service
          this.selectedRoom = null;
          
          // Select first available room if any
          if (this.chatRooms.length > 0) {
            this.selectRoom(this.chatRooms[0]);
          }
        },
        error: (error) => {
          console.error('❌ Error deleting room:', error);
        }
      });
  }

  onLeaveRoom(roomId: number): void {
    this.chatService.leaveRoom(roomId)
      .subscribe({
        next: () => {
          console.log('✅ Left room');
          // Room will be removed from local state by the service
          this.selectedRoom = null;
          
          // Select first available room if any
          if (this.chatRooms.length > 0) {
            this.selectRoom(this.chatRooms[0]);
          }
        },
        error: (error: any) => {
          console.error('❌ Error leaving room:', error);
        }
      });
  }

  onCreateGroup(): void {
    this.showCreateGroupModal = true;
  }

  onGroupCreated(room: ChatRoom): void {
    if (!this.currentUser) return;

    // Room has already been created by the modal component
    // Just select the new room and close the modal
    this.selectRoom(room);
    this.showCreateGroupModal = false;
    
    // Show success message
    console.log('Group created successfully:', room.name);
  }

  onCloseModal(): void {
    this.showCreateGroupModal = false;
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/forum' }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { returnUrl: '/forum' }
    });
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  private selectRoom(room: ChatRoom): void {
    this.selectedRoom = room;
    
    // Initialize pagination state for this room if not already present
    if (!this.messagePagination[room.id]) {
      this.messagePagination[room.id] = {
        page: 1,
        hasMore: true,
        loading: false
      };
    }
    
    // Join room via socket
    this.chatService.joinRoom(room.id);
    
    // Load messages for the room
    this.chatService.loadRoomMessages(room.id).subscribe({
      next: (messages) => {
        console.log(`✅ Loaded ${messages.length} messages for room ${room.id}`);
        // Ensure we have user data for message senders
        this.loadUsersFromMessages(messages);
        
        // Update pagination state based on initial load
        this.messagePagination[room.id] = {
          page: 1,
          hasMore: messages.length === 20, // Assuming 20 messages per page
          loading: false
        };
      },
      error: (error) => {
        console.error(`❌ Error loading messages for room ${room.id}:`, error);
      }
    });
    
    // Subscribe to messages for this room
    this.chatService.getMessagesForRoom(room.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages[room.id] = messages;
        // Ensure we have user data for new messages
        this.loadUsersFromMessages(messages);
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
  
  // Pagination Methods
  onLoadOlderMessages(): void {
    if (!this.selectedRoom || !this.currentUser) {
      console.log('⚠️ Cannot load older messages - no selected room or user');
      return;
    }
    
    const roomId = this.selectedRoom.id;
    const pagination = this.messagePagination[roomId] || { page: 1, hasMore: true, loading: false };
    
    if (pagination.loading || !pagination.hasMore) {
      console.log('📜 Skipping older messages load - already loading or no more messages');
      return;
    }
    
    console.log(`📜 Loading older messages for room ${roomId}, page ${pagination.page + 1}`);
    
    // Set loading state
    this.messagePagination[roomId] = {
      ...pagination,
      loading: true
    };
    
    // Load older messages from the chat service
    this.chatService.loadOlderMessages(roomId, pagination.page + 1)
      .subscribe({
        next: (olderMessages) => {
          console.log(`✅ Loaded ${olderMessages.length} older messages`);
          
          if (olderMessages.length > 0) {
            // Add older messages to the beginning of the current messages array
            const currentMessages = this.messages[roomId] || [];
            this.messages[roomId] = [...olderMessages, ...currentMessages];
            
            // Load user data from new messages
            this.loadUsersFromMessages(olderMessages);
            
            // Update pagination state
            this.messagePagination[roomId] = {
              page: pagination.page + 1,
              hasMore: olderMessages.length === 20, // Assuming 20 messages per page
              loading: false
            };
            
            console.log(`📍 Updated pagination for room ${roomId}:`, this.messagePagination[roomId]);
          } else {
            // No more messages available
            this.messagePagination[roomId] = {
              ...pagination,
              hasMore: false,
              loading: false
            };
            
            console.log(`📋 No more older messages for room ${roomId}`);
          }
        },
        error: (error) => {
          console.error('❌ Error loading older messages:', error);
          
          // Reset loading state on error
          this.messagePagination[roomId] = {
            ...pagination,
            loading: false
          };
        }
      });
  }
  
  // Check if there are more messages to load for a room
  hasMoreMessages(roomId: number): boolean {
    const pagination = this.messagePagination[roomId];
    return pagination ? pagination.hasMore : true;
  }
  
  // Check if currently loading older messages for a room
  isLoadingOlderMessages(roomId: number): boolean {
    const pagination = this.messagePagination[roomId];
    return pagination ? pagination.loading : false;
  }
  
  // Get pagination callbacks for child component
  getPaginationCallbacks() {
    return {
      isLoading: this.isLoadingOlderMessages.bind(this),
      hasMore: this.hasMoreMessages.bind(this)
    };
  }
}
