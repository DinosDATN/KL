import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { ChatRoom, ChatMessage, ChatRoomMember, ChatReaction } from '../models/chat.model';
import { User } from '../models/user.model';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.production ? environment.apiUrl : 'http://localhost:3000/api/v1';
  
  // State management
  private roomsSubject = new BehaviorSubject<ChatRoom[]>([]);
  private messagesSubject = new BehaviorSubject<{[roomId: number]: ChatMessage[]}>({});
  private typingUsersSubject = new BehaviorSubject<{[roomId: number]: User[]}>({});
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
    this.socketService.newMessage$.subscribe(message => {
      if (message) {
        this.addMessageToRoom(message);
      }
    });

    // Listen for typing indicators
    this.socketService.userTyping$.subscribe(data => {
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
          updated_at: ''
        };
        this.addTypingUser(data.roomId, user);
      }
    });

    this.socketService.userStopTyping$.subscribe(data => {
      if (data) {
        this.removeTypingUser(data.roomId, data.userId);
      }
    });

    // Listen for reaction updates
    this.socketService.reactionUpdate$.subscribe(reactionData => {
      if (reactionData) {
        this.updateMessageReaction(reactionData);
      }
    });

    // Listen for new rooms
    this.socketService.roomCreated$.subscribe(room => {
      if (room) {
        this.addRoom(room);
      }
    });

    // Listen for user online/offline status
    this.socketService.userOnline$.subscribe(data => {
      if (data) {
        this.updateUserOnlineStatus(data.userId, true);
      }
    });

    this.socketService.userOffline$.subscribe(data => {
      if (data) {
        this.updateUserOnlineStatus(data.userId, false);
      }
    });

    // Listen for notifications
    this.socketService.notification$.subscribe(notification => {
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
    this.socketService.error$.subscribe(error => {
      if (error) {
        console.error('Socket.IO error:', error);
        this.notificationService.error(
          'Lỗi kết nối chat',
          error.message
        );
      }
    });
  }

  // Initialize chat system
  initializeChat(): void {
    const user = this.authService.getCurrentUser();
    const token = this.authService.getToken();
    
    if (user && token) {
      this.socketService.connect(token, user);
      this.loadUserRooms().subscribe();
    }
  }

  // Disconnect from chat
  disconnect(): void {
    this.socketService.disconnect();
  }

  // API Methods
  loadUserRooms(): Observable<ChatRoom[]> {
    return this.http.get<{success: boolean, data: ChatRoom[]}>(`${this.apiUrl}/chat/rooms`)
      .pipe(
        map(response => response.data),
        tap(rooms => {
          this.roomsSubject.next(rooms);
          // Join all rooms via socket
          rooms.forEach(room => this.socketService.joinRoom(room.id));
        })
      );
  }

  loadRoomMessages(roomId: number, page: number = 1, limit: number = 50): Observable<ChatMessage[]> {
    return this.http.get<{success: boolean, data: {messages: ChatMessage[]}}>
      (`${this.apiUrl}/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`)
      .pipe(
        map(response => response.data.messages),
        tap(messages => {
          const currentMessages = this.messagesSubject.value;
          currentMessages[roomId] = messages;
          this.messagesSubject.next({...currentMessages});
        })
      );
  }

  sendMessage(roomId: number, content: string, type: string = 'text', replyTo?: number): void {
    // Send via Socket.IO for real-time delivery
    this.socketService.sendMessage(roomId, content, type, replyTo);
  }

  createRoom(roomData: {
    name: string;
    description?: string;
    type?: string;
    is_public?: boolean;
    memberIds?: number[];
  }): Observable<ChatRoom> {
    return this.http.post<{success: boolean, data: ChatRoom}>(`${this.apiUrl}/chat/rooms`, roomData)
      .pipe(
        map(response => response.data),
        tap(room => {
          // Also send via socket for real-time notification to members
          this.socketService.createRoom({
            name: roomData.name,
            description: roomData.description,
            type: roomData.type,
            isPublic: roomData.is_public,
            memberIds: roomData.memberIds
          });
        })
      );
  }

  getRoomMembers(roomId: number): Observable<User[]> {
    return this.http.get<{success: boolean, data: ChatRoomMember[]}>
      (`${this.apiUrl}/chat/rooms/${roomId}/members`)
      .pipe(
        map(response => response.data.map(member => member.User).filter(user => user !== undefined) as User[])
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

  leaveRoom(roomId: number): void {
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
        updated_at: null
      }
    };
    
    currentMessages[message.room_id].push(enhancedMessage);
    this.messagesSubject.next({...currentMessages});

    // Update room's last message info
    const rooms = this.roomsSubject.value;
    const room = rooms.find(r => r.id === message.room_id);
    if (room) {
      room.last_message_id = message.id;
      room.updated_at = message.sent_at;
      this.roomsSubject.next([...rooms]);
    }
  }

  private addRoom(room: ChatRoom): void {
    const currentRooms = this.roomsSubject.value;
    if (!currentRooms.find(r => r.id === room.id)) {
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
    
    const existingIndex = currentTyping[roomId].findIndex(u => u.id === user.id);
    if (existingIndex === -1) {
      currentTyping[roomId].push(user);
      this.typingUsersSubject.next({...currentTyping});
    }
  }

  private removeTypingUser(roomId: number, userId: number): void {
    const currentTyping = this.typingUsersSubject.value;
    if (currentTyping[roomId]) {
      currentTyping[roomId] = currentTyping[roomId].filter(u => u.id !== userId);
      this.typingUsersSubject.next({...currentTyping});
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
      const messageIndex = currentMessages[roomId].findIndex(m => m.id === reactionData.messageId);
      if (messageIndex !== -1) {
        const message = currentMessages[roomId][messageIndex];
        
        // Update reactions array (this would need to be implemented based on your exact data structure)
        // For now, we'll assume reactions are handled separately or you can implement the logic here
        
        this.messagesSubject.next({...currentMessages});
        break;
      }
    }
  }

  private updateUserOnlineStatus(userId: number, isOnline: boolean): void {
    const currentUsers = this.onlineUsersSubject.value;
    
    if (isOnline) {
      // Add user to online list if not already present
      if (!currentUsers.find(u => u.id === userId)) {
        // You might want to fetch user details here
        // For now, we'll create a minimal user object
        const user = { id: userId, is_online: true } as User;
        this.onlineUsersSubject.next([...currentUsers, user]);
      }
    } else {
      // Remove user from online list
      const filteredUsers = currentUsers.filter(u => u.id !== userId);
      this.onlineUsersSubject.next(filteredUsers);
    }
  }

  // Utility methods
  getRoomsForCurrentUser(): Observable<ChatRoom[]> {
    return this.rooms$;
  }

  getMessagesForRoom(roomId: number): Observable<ChatMessage[]> {
    return this.messages$.pipe(
      map(messages => messages[roomId] || [])
    );
  }

  getTypingUsersForRoom(roomId: number): Observable<User[]> {
    return this.typingUsers$.pipe(
      map(typing => typing[roomId] || [])
    );
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socketService.isConnected();
  }

  // User search methods
  searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return new Observable(observer => observer.next([]));
    }
    
    return this.http.get<{success: boolean, data: User[]}>(
      `${this.apiUrl}/chat/users/search?q=${encodeURIComponent(searchTerm)}`
    ).pipe(
      map(response => response.data)
    );
  }

  getOnlineUsers(): Observable<User[]> {
    return this.http.get<{success: boolean, data: User[]}>(
      `${this.apiUrl}/chat/users/online`
    ).pipe(
      map(response => response.data)
    );
  }

  validateRoomMembers(memberIds: number[]): Observable<{validMembers: User[], invalidMembers: number[]}> {
    return this.http.post<{success: boolean, data: {validMembers: User[], invalidMembers: number[]}}>(
      `${this.apiUrl}/chat/rooms/validate-members`,
      { memberIds }
    ).pipe(
      map(response => response.data)
    );
  }

  // Enhanced room creation with validation
  createRoomWithValidation(roomData: {
    name: string;
    description?: string;
    type?: string;
    is_public?: boolean;
    memberIds?: number[];
  }): Observable<{room: ChatRoom, validMembers: User[], invalidMembers: number[]}> {
    // First validate members if any
    if (roomData.memberIds && roomData.memberIds.length > 0) {
      return this.validateRoomMembers(roomData.memberIds).pipe(
        switchMap(validationResult => 
          this.createRoom({
            ...roomData,
            memberIds: validationResult.validMembers.map(u => u.id)
          }).pipe(
            map(room => ({
              room,
              validMembers: validationResult.validMembers,
              invalidMembers: validationResult.invalidMembers
            }))
          )
        )
      );
    } else {
      return this.createRoom(roomData).pipe(
        map(room => ({
          room,
          validMembers: [],
          invalidMembers: []
        }))
      );
    }
  }
}
