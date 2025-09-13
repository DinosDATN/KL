import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ChatRoom, ChatMessage, ChatReaction } from '../models/chat.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = new BehaviorSubject<boolean>(false);
  private currentUser: User | null = null;

  // Observable streams
  public isConnected$ = this.connected.asObservable();
  private messageSubject = new BehaviorSubject<ChatMessage | null>(null);
  public newMessage$ = this.messageSubject.asObservable();

  private typingSubject = new BehaviorSubject<{
    userId: number;
    username: string;
    roomId: number;
  } | null>(null);
  public userTyping$ = this.typingSubject.asObservable();

  private stopTypingSubject = new BehaviorSubject<{
    userId: number;
    roomId: number;
  } | null>(null);
  public userStopTyping$ = this.stopTypingSubject.asObservable();

  private reactionSubject = new BehaviorSubject<any>(null);
  public reactionUpdate$ = this.reactionSubject.asObservable();

  private roomCreatedSubject = new BehaviorSubject<ChatRoom | null>(null);
  public roomCreated$ = this.roomCreatedSubject.asObservable();

  private userOnlineSubject = new BehaviorSubject<{
    userId: number;
    username: string;
  } | null>(null);
  public userOnline$ = this.userOnlineSubject.asObservable();

  private userOfflineSubject = new BehaviorSubject<{
    userId: number;
    username: string;
  } | null>(null);
  public userOffline$ = this.userOfflineSubject.asObservable();

  private notificationSubject = new BehaviorSubject<{
    type: string;
    message: string;
    roomId?: number;
    timestamp: string;
  } | null>(null);
  public notification$ = this.notificationSubject.asObservable();

  private errorSubject = new BehaviorSubject<{
    message: string;
    details?: string;
  } | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor() {}

  connect(token: string, user: User): void {
    if (this.socket?.connected) {
      console.log('🔗 Socket already connected');
      return;
    }

    console.log('📁 Connecting to Socket.IO server...');
    console.log('👤 User:', user.name);
    console.log('🔑 Token provided:', !!token);

    this.currentUser = user;
    const serverUrl = environment.production
      ? environment.apiUrl
      : 'http://localhost:3000';

    console.log('🌍 Server URL:', serverUrl);

    this.socket = io(serverUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      console.error('🔍 Error details:', error.message);
      if (error.message.includes('Authentication')) {
        console.error('🔐 Authentication failed - check JWT token');
      }
      this.connected.next(false);
    });

    // Listen for new messages
    this.socket.on('new_message', (message: ChatMessage) => {
      console.log('📨 Received new message via Socket.IO:', message);
      this.messageSubject.next(message);
    });

    // Listen for typing indicators
    this.socket.on(
      'user_typing',
      (data: { userId: number; username: string; roomId: number }) => {
        this.typingSubject.next(data);
      }
    );

    this.socket.on(
      'user_stop_typing',
      (data: { userId: number; roomId: number }) => {
        this.stopTypingSubject.next(data);
      }
    );

    // Listen for reaction updates
    this.socket.on('reaction_update', (data: any) => {
      this.reactionSubject.next(data);
    });

    // Listen for new rooms
    this.socket.on('room_created', (room: ChatRoom) => {
      this.roomCreatedSubject.next(room);
    });

    // Listen for user status changes
    this.socket.on(
      'user_online',
      (data: { userId: number; username: string }) => {
        this.userOnlineSubject.next(data);
      }
    );

    this.socket.on(
      'user_offline',
      (data: { userId: number; username: string }) => {
        this.userOfflineSubject.next(data);
      }
    );

    // Listen for notifications
    this.socket.on(
      'notification',
      (data: {
        type: string;
        message: string;
        roomId?: number;
        timestamp: string;
      }) => {
        this.notificationSubject.next(data);
      }
    );

    // Listen for errors
    this.socket.on('error', (error: { message: string; details?: string }) => {
      console.error('Socket error:', error.message);
      this.errorSubject.next(error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected.next(false);
    }
  }

  // Room management
  joinRoom(roomId: number): void {
    if (this.socket) {
      this.socket.emit('join_room', roomId);
    }
  }

  leaveRoom(roomId: number): void {
    if (this.socket) {
      this.socket.emit('leave_room', roomId);
    }
  }

  // Message handling
  sendMessage(
    roomId: number,
    content: string,
    type: string = 'text',
    replyTo?: number
  ): void {
    console.log('💬 Attempting to send message...');
    console.log('📋 Room ID:', roomId);
    console.log('💬 Content:', content);
    console.log('🔗 Socket connected:', this.socket?.connected);
    
    if (this.socket) {
      console.log('🚀 Emitting send_message event...');
      this.socket.emit('send_message', {
        roomId,
        content,
        type,
        replyTo,
      });
      console.log('✅ Message sent via Socket.IO');
    } else {
      console.error('❌ Socket not available');
    }
  }

  // Typing indicators
  startTyping(roomId: number): void {
    if (this.socket) {
      this.socket.emit('typing_start', { roomId });
    }
  }

  stopTyping(roomId: number): void {
    if (this.socket) {
      this.socket.emit('typing_stop', { roomId });
    }
  }

  // Reactions
  addReaction(messageId: number, reactionType: string): void {
    if (this.socket) {
      this.socket.emit('add_reaction', {
        messageId,
        reactionType,
      });
    }
  }

  // Room creation
  createRoom(roomData: {
    name: string;
    description?: string;
    type?: string;
    isPublic?: boolean;
    memberIds?: number[];
  }): void {
    if (this.socket) {
      this.socket.emit('create_room', roomData);
    }
  }

  // Listen for specific events
  onJoinedRoom(): Observable<{ roomId: number; success: boolean }> {
    return new Observable((observer) => {
      if (this.socket) {
        this.socket.on('joined_room', (data) => observer.next(data));
      }
    });
  }

  onLeftRoom(): Observable<{ roomId: number }> {
    return new Observable((observer) => {
      if (this.socket) {
        this.socket.on('left_room', (data) => observer.next(data));
      }
    });
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }
}
