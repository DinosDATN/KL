import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import {
  ChatRoom,
  ChatMessage,
  ChatRoomMember,
  ChatReaction,
} from '../models/chat.model';
import { User } from '../models/user.model';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = environment.production
    ? environment.apiUrl
    : 'http://localhost:3000/api/v1';

  // State management
  private roomsSubject = new BehaviorSubject<ChatRoom[]>([]);
  private messagesSubject = new BehaviorSubject<{
    [roomId: number]: ChatMessage[];
  }>({});
  private typingUsersSubject = new BehaviorSubject<{
    [roomId: number]: User[];
  }>({});
  private onlineUsersSubject = new BehaviorSubject<User[]>([]);

  public rooms$ = this.roomsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public typingUsers$ = this.typingUsersSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.initializeSocketListeners();
  }

  // Initialize real-time listeners
  private initializeSocketListeners(): void {
    // Listen for new messages
    this.socketService.newMessage$.subscribe((message) => {
      if (message) {
        console.log('📬 ChatService: New message received', message);
        this.addMessageToRoom(message);
        console.log('✅ ChatService: Message added to room', message.room_id);
      }
    });

    // Listen for typing indicators
    this.socketService.userTyping$.subscribe((data) => {
      if (data) {
        const user: User = {
          id: data.userId,
          name: data.username,
          email: '',
          role: 'user',
          is_active: true,
          is_online: true,
          last_seen_at: null,
          subscription_status: 'free',
          subscription_end_date: null,
          created_at: '',
          updated_at: '',
        };
        this.addTypingUser(data.roomId, user);
      }
    });

    this.socketService.userStopTyping$.subscribe((data) => {
      if (data) {
        this.removeTypingUser(data.roomId, data.userId);
      }
    });

    // Listen for reaction updates
    this.socketService.reactionUpdate$.subscribe((reactionData) => {
      if (reactionData) {
        this.updateMessageReaction(reactionData);
      }
    });

    // Listen for new rooms
    this.socketService.roomCreated$.subscribe((room) => {
      if (room) {
        this.addRoom(room);
      }
    });

    // Listen for user online/offline status
    this.socketService.userOnline$.subscribe((data) => {
      if (data) {
        this.updateUserOnlineStatus(data.userId, true);
      }
    });

    this.socketService.userOffline$.subscribe((data) => {
      if (data) {
        this.updateUserOnlineStatus(data.userId, false);
      }
    });

    // Listen for notifications
    this.socketService.notification$.subscribe((notification) => {
      if (notification) {
        // Handle different types of notifications
        switch (notification.type) {
          case 'room_invite':
            // Show notification for room invitation
            this.notificationService.info(
              'Mời vào nhóm chat',
              notification.message,
              7000
            );
            // Refresh rooms list when user is invited to a room
            this.loadUserRooms().subscribe();
            break;
          case 'user_joined':
            this.notificationService.info(
              'Thành viên mới',
              notification.message,
              3000
            );
            break;
          case 'user_left':
            this.notificationService.info(
              'Thành viên rời nhóm',
              notification.message,
              3000
            );
            break;
          case 'room_created':
            this.notificationService.success(
              'Tạo nhóm thành công',
              notification.message,
              5000
            );
            break;
        }
      }
    });

    // Listen for Socket.IO errors
    this.socketService.error$.subscribe((error) => {
      if (error) {
        console.error('Socket.IO error:', error);
        this.notificationService.error('Lỗi kết nối chat', error.message);
      }
    });
  }

  // Initialize chat system
  initializeChat(): void {
    const user = this.authService.getCurrentUser();
    const token = this.authService.getToken();

    console.log('🚀 Initializing chat system...');
    console.log('👤 Current user:', user?.name);
    console.log('🔑 Token available:', !!token);
    console.log('🔐 User authenticated:', this.authService.isAuthenticated());

    if (user && token) {
      // Only connect socket if not already connected
      if (!this.socketService.isConnected()) {
        console.log('✅ Starting Socket.IO connection from chat service...');
        this.socketService.connect(token, user);
      } else {
        console.log('✅ Socket already connected, skipping connection');
      }
      
      this.loadUserRooms().subscribe({
        next: (rooms) => {
          console.log(`✅ Loaded ${rooms.length} chat rooms`);
        },
        error: (error) => {
          console.error('❌ Error loading chat rooms:', error);
        },
      });
    } else {
      console.log('❌ Cannot initialize chat - missing user or token');
    }
  }

  // DEPRECATED: Do not use this method!
  // Socket connection should persist across pages to receive notifications
  // Only disconnect when user logs out (handled in app.component.ts)
  disconnect(): void {
    console.warn('⚠️ ChatService.disconnect() is deprecated and should not be used!');
    console.warn('⚠️ Socket connection must persist to receive notifications across all pages.');
    console.warn('⚠️ Socket will only disconnect when user logs out.');
    // Do NOT disconnect socket here
    // this.socketService.disconnect();
  }

  // API Methods
  loadUserRooms(): Observable<ChatRoom[]> {
    return this.http
      .get<{ success: boolean; data: ChatRoom[] }>(`${this.apiUrl}/chat/rooms`)
      .pipe(
        map((response) => response.data),
        tap((rooms) => {
          this.roomsSubject.next(rooms);
          // Join all rooms via socket
          rooms.forEach((room) => this.socketService.joinRoom(room.id));
        })
      );
  }

  loadRoomMessages(
    roomId: number,
    page: number = 1,
    limit: number = 50
  ): Observable<ChatMessage[]> {
    return this.http
      .get<{ success: boolean; data: { messages: ChatMessage[] } }>(
        `${this.apiUrl}/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`
      )
      .pipe(
        map((response) => response.data.messages),
        tap((messages) => {
          const currentMessages = this.messagesSubject.value;
          currentMessages[roomId] = messages;
          this.messagesSubject.next({ ...currentMessages });
        })
      );
  }

  // Load older messages for pagination
  loadOlderMessages(
    roomId: number,
    page: number,
    limit: number = 20
  ): Observable<ChatMessage[]> {
    console.log(
      `📜 ChatService: Loading older messages for room ${roomId}, page ${page}`
    );

    return this.http
      .get<{ success: boolean; data: { messages: ChatMessage[] } }>(
        `${this.apiUrl}/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`
      )
      .pipe(
        map((response) => {
          console.log(
            `✅ ChatService: Received ${response.data.messages.length} older messages`
          );
          return response.data.messages;
        })
      );
  }

  // Upload file for chat
  uploadFile(
    file: File
  ): Observable<{
    file_url: string;
    file_name: string;
    file_size: number;
    type: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{
        success: boolean;
        data: {
          file_url: string;
          file_name: string;
          file_size: number;
          type: string;
        };
      }>(`${this.apiUrl}/chat/upload`, formData)
      .pipe(map((response) => response.data));
  }

  sendMessage(
    roomId: number,
    content: string,
    type: string = 'text',
    replyTo?: number,
    fileUrl?: string | null,
    fileName?: string | null,
    fileSize?: number | null
  ): void {
    console.log('🗣️ ChatService: Sending message...');
    console.log('🏠 Room ID:', roomId);
    console.log('💬 Content:', content);

    // Generate temporary ID to prevent duplications
    const tempId = Date.now() + Math.random();

    // Create optimistic message for immediate UI update
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const optimisticMessage: ChatMessage = {
        id: tempId,
        room_id: roomId,
        sender_id: currentUser.id,
        content: content,
        type: type as any,
        time_stamp: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        is_edited: false,
        reply_to: replyTo || null,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        Sender: currentUser,
      };

      // Add optimistic message immediately
      this.addMessageToRoom(optimisticMessage);
    }

    // Send via Socket.IO for real-time delivery
    this.socketService.sendMessage(
      roomId,
      content,
      type,
      replyTo,
      fileUrl,
      fileName,
      fileSize
    );
  }

  createRoom(roomData: {
    name: string;
    description?: string;
    type?: string;
    is_public?: boolean;
    memberIds?: number[];
  }): Observable<ChatRoom> {
    console.log('🏠 ChatService: Creating room via HTTP API only');

    return this.http
      .post<{ success: boolean; data: ChatRoom }>(
        `${this.apiUrl}/chat/rooms`,
        roomData
      )
      .pipe(
        map((response) => response.data),
        tap((room) => {
          console.log('✅ Room created successfully:', room.name);
          // Add room to local state immediately
          this.addRoom(room);
        })
      );
  }

  getRoomMembers(roomId: number): Observable<User[]> {
    return this.http
      .get<{ success: boolean; data: ChatRoomMember[] }>(
        `${this.apiUrl}/chat/rooms/${roomId}/members`
      )
      .pipe(
        map(
          (response) =>
            response.data
              .map((member) => member.User)
              .filter((user) => user !== undefined) as User[]
        )
      );
  }

  addReaction(messageId: number, reactionType: string): void {
    // Send via Socket.IO for real-time reaction
    this.socketService.addReaction(messageId, reactionType);
  }

  // Room management
  joinRoom(roomId: number): void {
    this.socketService.joinRoom(roomId);
  }

  leaveRoomSocket(roomId: number): void {
    this.socketService.leaveRoom(roomId);
  }

  // Typing indicators
  startTyping(roomId: number): void {
    this.socketService.startTyping(roomId);
  }

  stopTyping(roomId: number): void {
    this.socketService.stopTyping(roomId);
  }

  // State management helpers
  private addMessageToRoom(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    if (!currentMessages[message.room_id]) {
      currentMessages[message.room_id] = [];
    }

    // Check for duplicate messages to prevent duplication bug
    // First, check by exact ID match
    const existingMessageById = currentMessages[message.room_id].find(
      (m) => m.id === message.id
    );

    if (existingMessageById) {
      console.log('🚫 Duplicate message detected by ID, skipping:', message.id);
      return;
    }

    // Check for optimistic message that should be replaced
    // Look for messages with same sender, timestamp, and file_url (if present)
    const isOptimisticMessage = (id: number) => {
      // Optimistic messages have temp IDs (Date.now() + Math.random())
      // Real message IDs are integers from database
      return id > 10000000000000; // Temp IDs are very large numbers
    };

    const existingOptimisticMessage = currentMessages[message.room_id].find(
      (m) => {
        // Check if this is an optimistic message from the same sender
        if (!isOptimisticMessage(m.id) || m.sender_id !== message.sender_id) {
          return false;
        }

        // Check timestamp (within 10 seconds to account for network delay)
        const timeDiff = Math.abs(
          new Date(m.sent_at).getTime() - new Date(message.sent_at).getTime()
        );
        if (timeDiff > 10000) {
          return false;
        }

        // For file messages, check file_url match (primary identifier)
        const hasFile = !!(message.file_url || m.file_url);
        if (hasFile) {
          // Both should have file_url
          if (!message.file_url || !m.file_url) {
            console.log('❌ File message mismatch: missing file_url', {
              optimistic: { has_url: !!m.file_url },
              real: { has_url: !!message.file_url }
            });
            return false;
          }
          
          // Compare file_url (normalize paths for comparison)
          const normalizeUrl = (url: string | null) => {
            if (!url) return '';
            // Normalize path separators and remove query params
            return url.replace(/\\/g, '/').split('?')[0].toLowerCase().trim();
          };
          
          const optimisticUrl = normalizeUrl(m.file_url);
          const realUrl = normalizeUrl(message.file_url);
          const urlMatch = optimisticUrl === realUrl;
          
          if (urlMatch) {
            console.log('✅ Found matching optimistic file message by URL:', {
              optimistic: { 
                id: m.id, 
                file_url: m.file_url, 
                file_name: m.file_name,
                normalized_url: optimisticUrl
              },
              real: { 
                id: message.id, 
                file_url: message.file_url, 
                file_name: message.file_name,
                normalized_url: realUrl
              }
            });
            return true;
          } else {
            console.log('❌ File URL mismatch:', {
              optimistic: { url: m.file_url, normalized: optimisticUrl },
              real: { url: message.file_url, normalized: realUrl }
            });
          }
          
          return false;
        }

        // For text messages, check content match
        if (message.content && m.content) {
          return message.content.trim() === m.content.trim();
        }

        // If both are empty and same sender/time, likely the same message
        return !message.content && !m.content;
      }
    );

    // Replace optimistic message with real message
    if (existingOptimisticMessage) {
      console.log(
        '🔄 Replacing optimistic message with real message:',
        existingOptimisticMessage.id,
        '->',
        message.id
      );
      const optimisticIndex = currentMessages[message.room_id].findIndex(
        (m) => m.id === existingOptimisticMessage.id
      );
      if (optimisticIndex !== -1) {
        // Ensure message has proper structure with sender info and file metadata
        // Preserve file_name and file_size from optimistic message if real message doesn't have them
        const enhancedMessage = {
          ...message,
          // Preserve file metadata from optimistic message if missing in real message
          file_name: message.file_name || existingOptimisticMessage.file_name || null,
          file_size: message.file_size || existingOptimisticMessage.file_size || null,
          // Ensure file_url is present
          file_url: message.file_url || existingOptimisticMessage.file_url || null,
          Sender: message.Sender || existingOptimisticMessage.Sender || {
            id: message.sender_id,
            name: 'Unknown User',
            email: '',
            role: 'user' as const,
            is_active: true,
            is_online: false,
            subscription_status: 'free' as const,
            subscription_end_date: null,
            created_at: '',
            updated_at: null,
          },
        };
        currentMessages[message.room_id][optimisticIndex] = enhancedMessage;
        this.messagesSubject.next({ ...currentMessages });
        console.log('✅ Optimistic message replaced successfully');
        return;
      }
    }

    // Check for duplicate by content/sender/timestamp (fallback)
    // Also check for file messages with same file_url
    const existingMessage = currentMessages[message.room_id].find(
      (m) => {
        // Skip if this is the same message (already checked by ID)
        if (m.id === message.id) {
          return false;
        }
        
        // For file messages, check file_url match
        if (message.file_url && m.file_url) {
          const normalizeUrl = (url: string | null) => {
            if (!url) return '';
            return url.replace(/\\/g, '/').split('?')[0].toLowerCase().trim();
          };
          
          const urlMatch = normalizeUrl(message.file_url) === normalizeUrl(m.file_url);
          const senderMatch = m.sender_id === message.sender_id;
          const timeMatch = Math.abs(
            new Date(m.sent_at).getTime() - new Date(message.sent_at).getTime()
          ) < 10000; // 10 seconds window
          
          if (urlMatch && senderMatch && timeMatch) {
            console.log('🚫 Duplicate file message detected by URL, removing old one:', {
              old: { id: m.id, file_url: m.file_url, file_name: m.file_name },
              new: { id: message.id, file_url: message.file_url, file_name: message.file_name }
            });
            // Remove the old duplicate message
            const duplicateIndex = currentMessages[message.room_id].findIndex(msg => msg.id === m.id);
            if (duplicateIndex !== -1) {
              currentMessages[message.room_id].splice(duplicateIndex, 1);
            }
            return true; // Indicate duplicate found
          }
        }
        
        // For text messages, check content match
        return (
          m.content === message.content &&
          m.sender_id === message.sender_id &&
          Math.abs(
            new Date(m.sent_at).getTime() - new Date(message.sent_at).getTime()
          ) < 1000
        );
      }
    );

    if (existingMessage) {
      console.log('🚫 Duplicate message detected, skipping:', message.id);
      // If we removed a duplicate, update the subject
      if (message.file_url) {
        this.messagesSubject.next({ ...currentMessages });
      }
      return;
    }

    // Ensure message has proper structure with sender info
    const enhancedMessage = {
      ...message,
      // Make sure we have sender information
      Sender: message.Sender || {
        id: message.sender_id,
        name: 'Unknown User',
        email: '',
        role: 'user' as const,
        is_active: true,
        is_online: false,
        subscription_status: 'free' as const,
        subscription_end_date: null,
        created_at: '',
        updated_at: null,
      },
    };

    // Insert message in chronological order to maintain proper order
    const messageTime = new Date(enhancedMessage.sent_at).getTime();
    let insertIndex = currentMessages[message.room_id].length;

    for (let i = currentMessages[message.room_id].length - 1; i >= 0; i--) {
      const existingMessageTime = new Date(
        currentMessages[message.room_id][i].sent_at
      ).getTime();
      if (messageTime > existingMessageTime) {
        break;
      }
      insertIndex = i;
    }

    currentMessages[message.room_id].splice(insertIndex, 0, enhancedMessage);
    this.messagesSubject.next({ ...currentMessages });

    console.log(
      '✅ Message added to room',
      message.room_id,
      'at index',
      insertIndex
    );

    // Update room's last message info
    const rooms = this.roomsSubject.value;
    const room = rooms.find((r) => r.id === message.room_id);
    if (room) {
      room.last_message_id = message.id;
      room.updated_at = message.sent_at;
      this.roomsSubject.next([...rooms]);
    }
  }

  private addRoom(room: ChatRoom): void {
    const currentRooms = this.roomsSubject.value;
    if (!currentRooms.find((r) => r.id === room.id)) {
      currentRooms.unshift(room);
      this.roomsSubject.next([...currentRooms]);
      // Join the new room
      this.socketService.joinRoom(room.id);
    }
  }

  private addTypingUser(roomId: number, user: User): void {
    const currentTyping = this.typingUsersSubject.value;
    if (!currentTyping[roomId]) {
      currentTyping[roomId] = [];
    }

    const existingIndex = currentTyping[roomId].findIndex(
      (u) => u.id === user.id
    );
    if (existingIndex === -1) {
      currentTyping[roomId].push(user);
      this.typingUsersSubject.next({ ...currentTyping });
    }
  }

  private removeTypingUser(roomId: number, userId: number): void {
    const currentTyping = this.typingUsersSubject.value;
    if (currentTyping[roomId]) {
      currentTyping[roomId] = currentTyping[roomId].filter(
        (u) => u.id !== userId
      );
      this.typingUsersSubject.next({ ...currentTyping });
    }
  }

  private updateMessageReaction(reactionData: {
    messageId: number;
    userId: number;
    username: string;
    reactionType: string;
    action: 'added' | 'updated' | 'removed';
  }): void {
    const currentMessages = this.messagesSubject.value;

    // Find the message in any room
    for (const roomId in currentMessages) {
      const messageIndex = currentMessages[roomId].findIndex(
        (m) => m.id === reactionData.messageId
      );
      if (messageIndex !== -1) {
        const message = currentMessages[roomId][messageIndex];

        // Update reactions array (this would need to be implemented based on your exact data structure)
        // For now, we'll assume reactions are handled separately or you can implement the logic here

        this.messagesSubject.next({ ...currentMessages });
        break;
      }
    }
  }

  private updateUserOnlineStatus(userId: number, isOnline: boolean): void {
    const currentUsers = this.onlineUsersSubject.value;

    if (isOnline) {
      // Add user to online list if not already present
      if (!currentUsers.find((u) => u.id === userId)) {
        // You might want to fetch user details here
        // For now, we'll create a minimal user object
        const user = { id: userId, is_online: true } as User;
        this.onlineUsersSubject.next([...currentUsers, user]);
      }
    } else {
      // Remove user from online list
      const filteredUsers = currentUsers.filter((u) => u.id !== userId);
      this.onlineUsersSubject.next(filteredUsers);
    }
  }

  // Utility methods
  getRoomsForCurrentUser(): Observable<ChatRoom[]> {
    return this.rooms$;
  }

  getMessagesForRoom(roomId: number): Observable<ChatMessage[]> {
    return this.messages$.pipe(map((messages) => messages[roomId] || []));
  }

  getTypingUsersForRoom(roomId: number): Observable<User[]> {
    return this.typingUsers$.pipe(map((typing) => typing[roomId] || []));
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socketService.isConnected();
  }

  // User search methods
  searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return new Observable((observer) => observer.next([]));
    }

    return this.http
      .get<{ success: boolean; data: User[] }>(
        `${this.apiUrl}/chat/users/search?q=${encodeURIComponent(searchTerm)}`
      )
      .pipe(map((response) => response.data));
  }

  getOnlineUsers(): Observable<User[]> {
    return this.http
      .get<{ success: boolean; data: User[] }>(
        `${this.apiUrl}/chat/users/online`
      )
      .pipe(map((response) => response.data));
  }

  validateRoomMembers(
    memberIds: number[]
  ): Observable<{ validMembers: User[]; invalidMembers: number[] }> {
    return this.http
      .post<{
        success: boolean;
        data: { validMembers: User[]; invalidMembers: number[] };
      }>(`${this.apiUrl}/chat/rooms/validate-members`, { memberIds })
      .pipe(map((response) => response.data));
  }

  // Enhanced room creation with validation
  createRoomWithValidation(roomData: {
    name: string;
    description?: string;
    type?: string;
    is_public?: boolean;
    memberIds?: number[];
  }): Observable<{
    room: ChatRoom;
    validMembers: User[];
    invalidMembers: number[];
  }> {
    // First validate members if any
    if (roomData.memberIds && roomData.memberIds.length > 0) {
      return this.validateRoomMembers(roomData.memberIds).pipe(
        switchMap((validationResult) =>
          this.createRoom({
            ...roomData,
            memberIds: validationResult.validMembers.map((u) => u.id),
          }).pipe(
            map((room) => ({
              room,
              validMembers: validationResult.validMembers,
              invalidMembers: validationResult.invalidMembers,
            }))
          )
        )
      );
    } else {
      return this.createRoom(roomData).pipe(
        map((room) => ({
          room,
          validMembers: [],
          invalidMembers: [],
        }))
      );
    }
  }

  // Chat Settings Management
  updateRoomSettings(roomId: number, settings: any): Observable<ChatRoom> {
    return this.http
      .put<{ success: boolean; data: ChatRoom }>(
        `${this.apiUrl}/chat/rooms/${roomId}/settings`,
        settings
      )
      .pipe(
        map((response) => response.data),
        tap((updatedRoom) => {
          // Update room in local state
          const rooms = this.roomsSubject.value;
          const roomIndex = rooms.findIndex((r) => r.id === roomId);
          if (roomIndex !== -1) {
            rooms[roomIndex] = updatedRoom;
            this.roomsSubject.next([...rooms]);
          }
        })
      );
  }

  addMemberToRoom(roomId: number, userId: number): Observable<User> {
    return this.http
      .post<{ success: boolean; data: User }>(
        `${this.apiUrl}/chat/rooms/${roomId}/members`,
        { userId }
      )
      .pipe(map((response) => response.data));
  }

  removeMemberFromRoom(roomId: number, userId: number): Observable<void> {
    return this.http
      .delete<{ success: boolean }>(
        `${this.apiUrl}/chat/rooms/${roomId}/members/${userId}`
      )
      .pipe(map(() => void 0));
  }

  updateMemberRole(
    roomId: number,
    userId: number,
    isAdmin: boolean
  ): Observable<void> {
    return this.http
      .put<{ success: boolean }>(
        `${this.apiUrl}/chat/rooms/${roomId}/members/${userId}/role`,
        { isAdmin }
      )
      .pipe(map(() => void 0));
  }

  deleteRoom(roomId: number): Observable<void> {
    return this.http
      .delete<{ success: boolean }>(`${this.apiUrl}/chat/rooms/${roomId}`)
      .pipe(
        map(() => {
          // Remove room from local state
          const rooms = this.roomsSubject.value;
          const filteredRooms = rooms.filter((r) => r.id !== roomId);
          this.roomsSubject.next(filteredRooms);

          // Remove messages for this room
          const messages = this.messagesSubject.value;
          delete messages[roomId];
          this.messagesSubject.next({ ...messages });
        })
      );
  }

  leaveRoom(roomId: number): Observable<void> {
    return this.http
      .post<{ success: boolean }>(
        `${this.apiUrl}/chat/rooms/${roomId}/leave`,
        {}
      )
      .pipe(
        map(() => {
          // Remove room from local state
          const rooms = this.roomsSubject.value;
          const filteredRooms = rooms.filter((r) => r.id !== roomId);
          this.roomsSubject.next(filteredRooms);

          // Remove messages for this room
          const messages = this.messagesSubject.value;
          delete messages[roomId];
          this.messagesSubject.next({ ...messages });

          // Leave room via socket
          this.leaveRoomSocket(roomId);
        })
      );
  }

  // Optimistic message management
  private removeOptimisticMessage(roomId: number, tempId: number): void {
    const currentMessages = this.messagesSubject.value;
    if (currentMessages[roomId]) {
      currentMessages[roomId] = currentMessages[roomId].filter(
        (m) => m.id !== tempId
      );
      this.messagesSubject.next({ ...currentMessages });
    }
  }

  private replaceOptimisticMessage(
    roomId: number,
    tempId: number,
    realMessage: ChatMessage
  ): void {
    const currentMessages = this.messagesSubject.value;
    if (currentMessages[roomId]) {
      const messageIndex = currentMessages[roomId].findIndex(
        (m) => m.id === tempId
      );
      if (messageIndex !== -1) {
        currentMessages[roomId][messageIndex] = realMessage;
        this.messagesSubject.next({ ...currentMessages });
      }
    }
  }
}
