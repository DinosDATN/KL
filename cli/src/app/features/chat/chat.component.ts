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
import { Subject, takeUntil, filter, take, switchMap } from 'rxjs';

// Models
import {
  ChatRoom,
  ChatMessage,
  ChatRoomMember,
  ChatReaction,
} from '../../core/models/chat.model';
import { User } from '../../core/models/user.model';

// Services
import { ThemeService } from '../../core/services/theme.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

// Components
import { ChatSidebarComponent } from './components/chat-sidebar/chat-sidebar.component';
import { ChatMainComponent } from './components/chat-main/chat-main.component';
import { CreateGroupModalComponent } from './components/create-group-modal/create-group-modal.component';
import {
  ChatSettingsModalComponent,
  ChatSettings,
  MemberAction,
} from './components/chat-settings-modal/chat-settings-modal.component';
import { FriendsListComponent } from './components/friends-list/friends-list.component';
import { FriendRequestsComponent } from './components/friend-requests/friend-requests.component';
import { UserSearchComponent } from './components/user-search/user-search.component';
import { PrivateChatComponent } from './components/private-chat/private-chat.component';
import { PrivateChatSidebarComponent } from "./components/private-chat-sidebar/private-chat-sidebar.component";
import { FriendRequest } from '../../core/models/friendship.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChatSidebarComponent,
    ChatMainComponent,
    CreateGroupModalComponent,
    ChatSettingsModalComponent,
    FriendsListComponent,
    FriendRequestsComponent,
    UserSearchComponent,
    PrivateChatComponent,
    PrivateChatSidebarComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  // Data
  chatRooms: ChatRoom[] = [];
  messages: { [roomId: number]: ChatMessage[] } = {};
  users: User[] = [];
  roomMembers: ChatRoomMember[] = [];
  reactions: ChatReaction[] = [];
  friends: FriendRequest[] = []; // Placeholder - replace with actual friends data from service

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

  // Chat mode: 'groups' for group chat, 'private' for 1-1 chats, 'friends' for friends management
  chatMode: 'groups' | 'private' | 'friends' = 'groups';
  friendsTab: 'list' | 'requests' | 'search' = 'list';

  // Pagination state
  messagePagination: {
    [roomId: number]: { page: number; hasMore: boolean; loading: boolean };
  } = {};

  // Search
  searchTerm = '';

  // Search private chat 
  searchPrivateChatTerm = '';

  private destroy$ = new Subject<void>();
  private chatInitialized = false;

  constructor(
    public themeService: ThemeService,
    public router: Router,
    private chatService: ChatService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('🏗️ Chat: Constructor called');
    
    // Wait for auth initialization, then subscribe to user changes
    this.authService.authInitialized$
      .pipe(
        filter(initialized => {
          console.log('🔐 Chat: Auth initialized status:', initialized);
          return initialized === true;
        }),
        take(1)
      )
      .subscribe(() => {
        console.log('✅ Chat: Auth initialized, now subscribing to currentUser$');
        
        // Get current user immediately
        const currentUser = this.authService.getCurrentUser();
        console.log('👤 Chat: Current user from getCurrentUser():', currentUser?.name || 'null');
        
        if (currentUser) {
          // User is already logged in, initialize immediately
          this.currentUser = currentUser;
          console.log('🔄 Chat: User found, initializing chat immediately...');
          this.initializeChat();
        }
        
        // Also subscribe to future changes
        this.authService.currentUser$
          .pipe(takeUntil(this.destroy$))
          .subscribe((user) => {
            console.log('👤 Chat: Current user changed via observable:', user?.name || 'null');
            
            // Update current user
            const previousUser = this.currentUser;
            this.currentUser = user;
            
            if (user) {
              // User logged in or user data updated
              if (!previousUser || previousUser.id !== user.id) {
                console.log('🔄 Chat: User changed, initializing chat...');
                this.initializeChat();
              } else {
                console.log('ℹ️ Chat: User data updated, but same user');
              }
            } else {
              // User logged out
              if (previousUser) {
                console.log('👋 Chat: User logged out, clearing data...');
                this.clearChatData();
              }
            }
          });
      });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // DO NOT disconnect socket here!
    // Socket connection should persist across pages to receive notifications
    // Only disconnect when user logs out (handled in app.component.ts)
    
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }

  private initializeChat(): void {
    if (!this.currentUser) {
      console.info('🔑 User not authenticated - chat features disabled');
      return;
    }

    console.log('🚀 Chat: Initializing chat system...');
    console.log('📊 Chat: chatInitialized flag:', this.chatInitialized);
    console.log('📊 Chat: Current rooms count:', this.chatRooms.length);

    // Subscribe to observables only once
    if (!this.chatInitialized) {
      console.log('✅ Chat: First time initialization, setting up subscriptions...');
      this.chatInitialized = true;

      // Subscribe to rooms observable - this will receive updates when rooms are loaded
      this.chatService.rooms$
        .pipe(takeUntil(this.destroy$))
        .subscribe((rooms) => {
          console.log('📦 Chat: Received rooms update:', rooms.length);
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
        .subscribe((users) => {
          this.onlineUsers = users;
        });
    } else {
      console.log('ℹ️ Chat: Already subscribed to observables, skipping subscription setup');
    }

    // Always initialize chat service to load fresh data from API
    console.log('🔄 Chat: Calling chatService.initializeChat()...');
    this.chatService.initializeChat();
  }

  private clearChatData(): void {
    console.log('🧹 Chat: Clearing chat data...');
    // Clear all chat-related data when user logs out
    this.chatRooms = [];
    this.messages = {};
    this.selectedRoom = null;
    this.onlineUsers = [];
    this.roomMembers = [];
    this.reactions = [];
    this.chatInitialized = false; // Reset initialization flag

    // DO NOT disconnect socket here!
    // Socket disconnection is handled in app.component.ts when user logs out
  }

  private loadUsersFromRooms(rooms: ChatRoom[]): void {
    // Extract all users from rooms data (creators, members)
    const allUsers = new Map<number, User>();

    rooms.forEach((room) => {
      // Add creator
      if (room.Creator) {
        allUsers.set(room.Creator.id, room.Creator);
      }

      // Add all members if available
      if (room.all_members) {
        room.all_members.forEach((user) => {
          if (user && user.id) {
            allUsers.set(user.id, user);
          }
        });
      }

      // Add members from Members association
      if (room.Members) {
        room.Members.forEach((user) => {
          if (user && user.id) {
            allUsers.set(user.id, user);
          }
        });
      }
    });

    this.users = Array.from(allUsers.values());
    console.log(`👥 Loaded ${this.users.length} users from rooms data`);
  }

  private loadUsersFromMessages(messages: ChatMessage[]): void {
    const existingUserIds = new Set(this.users.map((u) => u.id));
    const newUsers: User[] = [];

    messages.forEach((message) => {
      if (message.Sender && !existingUserIds.has(message.Sender.id)) {
        newUsers.push(message.Sender);
        existingUserIds.add(message.Sender.id);
      }
    });

    if (newUsers.length > 0) {
      this.users = [...this.users, ...newUsers];
      console.log(`👥 Added ${newUsers.length} new users from messages`);
    }
  }

  // Room management methods
  onRoomSelected(room: ChatRoom): void {
    console.log('🏠 Room selected:', room.name);
    this.selectRoom(room);

    // Close sidebar on mobile when room is selected
    if (this.isMobileView) {
      this.showSidebar = false;
    }
  }

  // Message handling
  onSendMessage(content: string): void {
    if (!this.selectedRoom) {
      console.error('❌ Cannot send message: no room selected');
      return;
    }

    console.log(
      '💬 Sending message:',
      content,
      'to room:',
      this.selectedRoom.id
    );
    this.chatService.sendMessage(
      this.selectedRoom.id,
      content,
      'text',
      undefined
    );
  }

  onReactToMessage(messageId: number, reactionType: string): void {
    console.log('👍 Adding reaction:', reactionType, 'to message', messageId);
    this.chatService.addReaction(messageId, reactionType);
  }

  // Chat settings and member management
  onUpdateChatSettings(settings: ChatSettings): void {
    if (!this.selectedRoom) {
      console.error('❌ Cannot update settings: no room selected');
      return;
    }

    console.log(
      '⚙️ Updating chat settings:',
      settings,
      'for room:',
      this.selectedRoom.id
    );
    this.chatService
      .updateRoomSettings(this.selectedRoom.id, settings)
      .subscribe({
        next: (updatedRoom) => {
          console.log('✅ Room settings updated:', updatedRoom.name);
          // Update local room data
          const roomIndex = this.chatRooms.findIndex(
            (r) => r.id === this.selectedRoom!.id
          );
          if (roomIndex !== -1) {
            this.chatRooms[roomIndex] = updatedRoom;
            this.selectedRoom = updatedRoom;
          }
        },
        error: (error) => {
          console.error('❌ Error updating room settings:', error);
        },
      });
  }

  onHandleMemberAction(action: MemberAction): void {
    if (!this.selectedRoom) return;

    console.log(
      '👥 Handling member action:',
      action.type,
      'for user',
      action.user?.name
    );

    switch (action.type) {
      case 'add':
        if (action.userId) {
          this.chatService
            .addMemberToRoom(this.selectedRoom.id, action.userId)
            .subscribe({
              next: (user) => {
                console.log('✅ Member added:', user.name);
                // Update local members list
                this.roomMembers.push({
                  room_id: this.selectedRoom!.id,
                  user_id: user.id,
                  is_admin: false,
                  User: user,
                } as ChatRoomMember);
              },
              error: (error) => {
                console.error('❌ Error adding member:', error);
              },
            });
        }
        break;

      case 'remove':
        if (action.userId) {
          this.chatService
            .removeMemberFromRoom(this.selectedRoom.id, action.userId)
            .subscribe({
              next: () => {
                console.log('✅ Member removed:', action.user?.name);
                // Update local members list
                this.roomMembers = this.roomMembers.filter(
                  (m) => m.user_id !== action.userId
                );
              },
              error: (error) => {
                console.error('❌ Error removing member:', error);
              },
            });
        }
        break;

      case 'promote':
        if (action.userId) {
          this.chatService
            .updateMemberRole(this.selectedRoom.id, action.userId, true)
            .subscribe({
              next: () => {
                console.log('✅ Member promoted:', action.user?.name);
                // Update local members list
                const member = this.roomMembers.find(
                  (m) => m.user_id === action.userId
                );
                if (member) {
                  member.is_admin = true;
                }
              },
              error: (error) => {
                console.error('❌ Error promoting member:', error);
              },
            });
        }
        break;

      case 'demote':
        if (action.userId) {
          this.chatService
            .updateMemberRole(this.selectedRoom.id, action.userId, false)
            .subscribe({
              next: () => {
                console.log('✅ Member demoted:', action.user?.name);
                // Update local members list
                const member = this.roomMembers.find(
                  (m) => m.user_id === action.userId
                );
                if (member) {
                  member.is_admin = false;
                }
              },
              error: (error) => {
                console.error('❌ Error demoting member:', error);
              },
            });
        }
        break;
    }
  }

  onDeleteRoom(roomId: number): void {
    this.chatService.deleteRoom(roomId).subscribe({
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
      },
    });
  }

  onLeaveRoom(roomId: number): void {
    this.chatService.leaveRoom(roomId).subscribe({
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
      },
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
        loading: false,
      };
    }

    // Join room via socket
    this.chatService.joinRoom(room.id);

    // Load messages for the room
    this.chatService.loadRoomMessages(room.id).subscribe({
      next: (messages) => {
        console.log(
          `✅ Loaded ${messages.length} messages for room ${room.id}`
        );
        // Ensure we have user data for message senders
        this.loadUsersFromMessages(messages);

        // Update pagination state based on initial load
        this.messagePagination[room.id] = {
          page: 1,
          hasMore: messages.length === 20, // Assuming 20 messages per page
          loading: false,
        };
      },
      error: (error) => {
        console.error(`❌ Error loading messages for room ${room.id}:`, error);
      },
    });

    // Subscribe to messages for this room
    this.chatService
      .getMessagesForRoom(room.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages) => {
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
      this.chatService
        .getTypingUsersForRoom(roomId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((users) => {
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

  getFriendsList(): FriendRequest[] {
    let friends = this.friends;
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      friends = friends.filter((friend) =>
        friend.friend.name.toLowerCase().includes(term)
      );
    }
    // alert(friends);
    // sort by last_seen_at
    return friends.sort((a, b) => {
      const aTime = new Date(a.friend.last_seen_at || '').getTime();
      const bTime = new Date(b.friend.last_seen_at || '').getTime();
      return bTime - aTime;
    }
    );

  }
  // Pagination Methods
  onLoadOlderMessages(): void {
    if (!this.selectedRoom || !this.currentUser) {
      console.log('⚠️ Cannot load older messages - no selected room or user');
      return;
    }

    const roomId = this.selectedRoom.id;
    const pagination = this.messagePagination[roomId] || {
      page: 1,
      hasMore: true,
      loading: false,
    };

    if (pagination.loading || !pagination.hasMore) {
      console.log(
        '📜 Skipping older messages load - already loading or no more messages'
      );
      return;
    }

    console.log(
      `📜 Loading older messages for room ${roomId}, page ${pagination.page + 1
      }`
    );

    // Set loading state
    this.messagePagination[roomId] = {
      ...pagination,
      loading: true,
    };

    // Load older messages from the chat service
    this.chatService.loadOlderMessages(roomId, pagination.page + 1).subscribe({
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
            loading: false,
          };
        } else {
          // No more messages available
          this.messagePagination[roomId] = {
            ...pagination,
            hasMore: false,
            loading: false,
          };
        }
      },
      error: (error) => {
        console.error('❌ Error loading older messages:', error);
        // Reset loading state on error
        this.messagePagination[roomId] = {
          ...pagination,
          loading: false,
        };
      },
    });
  }

  getPaginationCallbacks() {
    return {
      loadOlderMessages: () => this.onLoadOlderMessages(),
      hasMore: (roomId: number) => {
        const pagination = this.messagePagination[roomId];
        return pagination ? pagination.hasMore : true;
      },
      isLoading: (roomId: number) => {
        const pagination = this.messagePagination[roomId];
        return pagination ? pagination.loading : false;
      },
    };
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/chat' },
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { returnUrl: '/chat' },
    });
  }

  // Mode switching methods
  setChatMode(mode: 'groups' | 'private' | 'friends'): void {
    this.chatMode = mode;

    // Don't close sidebar when switching modes - user is navigating within sidebar
    // Only close sidebar when selecting a room/conversation (handled in onRoomSelected)
  }

  setFriendsTab(tab: 'list' | 'requests' | 'search'): void {
    this.friendsTab = tab;
  }

  onStartPrivateChat(friend: User): void {
    this.setChatMode('private');
  }

  onReloadRooms(): void {
    console.log('🔄 Chat: Manual reload rooms requested');
    if (!this.currentUser) {
      console.warn('⚠️ Chat: Cannot reload rooms - no current user');
      return;
    }
    
    this.chatService.loadUserRooms().subscribe({
      next: (rooms) => {
        console.log(`✅ Chat: Manually reloaded ${rooms.length} rooms`);
      },
      error: (error) => {
        console.error('❌ Chat: Error manually reloading rooms:', error);
      }
    });
  }
}
