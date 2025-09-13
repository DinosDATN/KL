import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject, timer, EMPTY } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { ChatRoom, ChatMessage, ChatReaction } from '../models/chat.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface SocketConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  error: string | null;
  retryCount: number;
  lastConnected: Date | null;
}

export interface AuthError {
  type: string;
  message: string;
  timestamp: string;
  debug?: any;
}

@Injectable({
  providedIn: 'root',
})
export class EnhancedSocketService {
  private socket: Socket | null = null;
  private destroy$ = new Subject<void>();
  
  // Connection status tracking
  private connectionStatus = new BehaviorSubject<SocketConnectionStatus>({
    connected: false,
    authenticated: false,
    error: null,
    retryCount: 0,
    lastConnected: null
  });

  // Authentication state
  private authError = new BehaviorSubject<AuthError | null>(null);
  private currentUser: User | null = null;
  private connectionRetryCount = 0;
  private maxRetries = 3;
  private retryDelay = 2000; // Start with 2 seconds

  // Event streams
  private messageSubject = new BehaviorSubject<ChatMessage | null>(null);
  private typingSubject = new BehaviorSubject<{
    userId: number;
    username: string;
    roomId: number;
  } | null>(null);
  private stopTypingSubject = new BehaviorSubject<{
    userId: number;
    roomId: number;
  } | null>(null);
  private reactionSubject = new BehaviorSubject<any>(null);
  private roomCreatedSubject = new BehaviorSubject<ChatRoom | null>(null);
  private userOnlineSubject = new BehaviorSubject<{
    userId: number;
    username: string;
  } | null>(null);
  private userOfflineSubject = new BehaviorSubject<{
    userId: number;
    username: string;
  } | null>(null);
  private notificationSubject = new BehaviorSubject<{
    type: string;
    message: string;
    roomId?: number;
    timestamp: string;
  } | null>(null);
  private errorSubject = new BehaviorSubject<{
    message: string;
    details?: string;
  } | null>(null);

  // Public observables
  public connectionStatus$ = this.connectionStatus.asObservable();
  public authError$ = this.authError.asObservable();
  public newMessage$ = this.messageSubject.asObservable();
  public userTyping$ = this.typingSubject.asObservable();
  public userStopTyping$ = this.stopTypingSubject.asObservable();
  public reactionUpdate$ = this.reactionSubject.asObservable();
  public roomCreated$ = this.roomCreatedSubject.asObservable();
  public userOnline$ = this.userOnlineSubject.asObservable();
  public userOffline$ = this.userOfflineSubject.asObservable();
  public notification$ = this.notificationSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private authService: AuthService) {
    // Monitor auth state changes
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user && !this.isConnected()) {
        // User logged in, connect socket
        this.connect();
      } else if (!user && this.isConnected()) {
        // User logged out, disconnect socket
        this.disconnect();
      }
    });
  }

  /**
   * Get authentication token with multiple fallback methods
   * @returns {string | null} JWT token or null
   */
  private getAuthToken(): string | null {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('🚨 No authentication token available');
      return null;
    }

    // Verify token is not expired
    if (this.isTokenExpired(token)) {
      console.warn('🚨 Authentication token is expired');
      this.authService.logout().subscribe(); // Logout to clear expired token
      return null;
    }

    console.log('🔑 Using authentication token for Socket.IO connection');
    return token;
  }

  /**
   * Check if JWT token is expired
   * @param token - JWT token to check
   * @returns boolean indicating if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Assume expired if can't parse
    }
  }

  /**
   * Create Socket.IO connection with comprehensive configuration
   * @returns {Socket | null} Socket instance or null
   */
  private createSocket(): Socket | null {
    const token = this.getAuthToken();
    const user = this.authService.getCurrentUser();

    if (!token || !user) {
      console.error('❌ Cannot create socket - no token or user');
      this.updateConnectionStatus({
        connected: false,
        authenticated: false,
        error: 'No authentication credentials available'
      });
      return null;
    }

    this.currentUser = user;
    const serverUrl = environment.production
      ? environment.apiUrl
      : 'http://localhost:3000';

    console.log('🚀 Creating Socket.IO connection...');
    console.log('👤 User:', user.name);
    console.log('🌍 Server:', serverUrl);

    const socket = io(serverUrl, {
      // Authentication methods (multiple for compatibility)
      auth: {
        token: token,
        jwt: token,
        accessToken: token,
        user: user
      },
      
      // Additional authentication in headers
      extraHeaders: {
        'Authorization': `Bearer ${token}`,
        'X-Auth-Token': token
      },
      
      // Query parameters as fallback
      query: {
        token: token,
        jwt: token,
        access_token: token,
        userId: user.id?.toString()
      },

      // Connection options
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false, // We'll handle reconnection manually
      forceNew: true,
      
      // Performance options
      upgrade: true,
      rememberUpgrade: true
    });

    return socket;
  }

  /**
   * Connect to Socket.IO server with retry logic
   */
  public connect(): void {
    if (this.socket?.connected) {
      console.log('🔗 Socket already connected');
      return;
    }

    if (this.connectionRetryCount >= this.maxRetries) {
      console.error(`❌ Max connection retries (${this.maxRetries}) reached`);
      this.updateConnectionStatus({
        connected: false,
        authenticated: false,
        error: `Connection failed after ${this.maxRetries} attempts`
      });
      return;
    }

    console.log(`📡 Attempting Socket.IO connection (attempt ${this.connectionRetryCount + 1}/${this.maxRetries})`);

    this.socket = this.createSocket();
    if (!this.socket) {
      return;
    }

    this.setupSocketEventHandlers();
    this.connectionRetryCount++;
  }

  /**
   * Setup all Socket.IO event handlers
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      console.log('🆔 Socket ID:', this.socket?.id);
      
      this.connectionRetryCount = 0; // Reset retry count on successful connection
      this.updateConnectionStatus({
        connected: true,
        authenticated: true,
        error: null,
        lastConnected: new Date()
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.IO server:', reason);
      
      this.updateConnectionStatus({
        connected: false,
        authenticated: false,
        error: `Disconnected: ${reason}`
      });

      // Auto-reconnect for certain reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        console.log('🚫 Server initiated disconnect - not reconnecting');
      } else {
        // Client side issue, try to reconnect
        this.scheduleReconnect();
      }
    });

    // Authentication events
    this.socket.on('auth_error', (error: AuthError) => {
      console.error('🚫 Socket.IO authentication failed:', error);
      
      this.authError.next(error);
      this.updateConnectionStatus({
        connected: false,
        authenticated: false,
        error: `Authentication failed: ${error.message}`
      });

      // Handle specific auth error types
      switch (error.type) {
        case 'TOKEN_EXPIRED':
          console.log('🔄 Token expired, attempting to refresh...');
          this.authService.logout().subscribe(() => {
            // Redirect to login or show message
          });
          break;
        
        case 'USER_VALIDATION_FAILED':
          console.log('❌ User validation failed');
          break;
        
        default:
          console.log('❓ Unknown auth error type:', error.type);
          break;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      
      this.updateConnectionStatus({
        connected: false,
        authenticated: false,
        error: `Connection error: ${error.message}`
      });

      // Check if it's an authentication error
      if (error.message.includes('Authentication') || error.message.includes('authentication')) {
        this.authError.next({
          type: 'CONNECTION_AUTH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      } else {
        this.scheduleReconnect();
      }
    });

    // Chat events
    this.socket.on('new_message', (message: ChatMessage) => {
      console.log('📨 Received new message via Socket.IO:', message);
      this.messageSubject.next(message);
    });

    this.socket.on('user_typing', (data: { userId: number; username: string; roomId: number }) => {
      this.typingSubject.next(data);
    });

    this.socket.on('user_stop_typing', (data: { userId: number; roomId: number }) => {
      this.stopTypingSubject.next(data);
    });

    this.socket.on('reaction_update', (data: any) => {
      this.reactionSubject.next(data);
    });

    this.socket.on('room_created', (room: ChatRoom) => {
      this.roomCreatedSubject.next(room);
    });

    this.socket.on('user_online', (data: { userId: number; username: string }) => {
      this.userOnlineSubject.next(data);
    });

    this.socket.on('user_offline', (data: { userId: number; username: string }) => {
      this.userOfflineSubject.next(data);
    });

    this.socket.on('notification', (data: {
      type: string;
      message: string;
      roomId?: number;
      timestamp: string;
    }) => {
      this.notificationSubject.next(data);
    });

    this.socket.on('error', (error: { message: string; details?: string }) => {
      console.error('Socket error:', error.message);
      this.errorSubject.next(error);
    });

    // Joined/left room confirmations
    this.socket.on('joined_room', (data: { roomId: number; success: boolean }) => {
      console.log(`✅ Joined room ${data.roomId}:`, data.success);
    });

    this.socket.on('left_room', (data: { roomId: number }) => {
      console.log(`👋 Left room ${data.roomId}`);
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.connectionRetryCount >= this.maxRetries) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    const delay = this.retryDelay * Math.pow(2, this.connectionRetryCount - 1);
    console.log(`⏰ Scheduling reconnection in ${delay}ms (attempt ${this.connectionRetryCount + 1}/${this.maxRetries})`);

    timer(delay).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('🔄 Attempting to reconnect...');
      this.connect();
    });
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(updates: Partial<SocketConnectionStatus>): void {
    const currentStatus = this.connectionStatus.value;
    const newStatus = {
      ...currentStatus,
      ...updates,
      retryCount: this.connectionRetryCount
    };
    
    this.connectionStatus.next(newStatus);
  }

  /**
   * Disconnect from Socket.IO server
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO server...');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionRetryCount = 0;
    this.updateConnectionStatus({
      connected: false,
      authenticated: false,
      error: null
    });
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): SocketConnectionStatus {
    return this.connectionStatus.value;
  }

  // Chat operations (same as before but with connection checks)
  
  public joinRoom(roomId: number): void {
    if (!this.isConnected()) {
      console.error('❌ Cannot join room - socket not connected');
      return;
    }
    this.socket!.emit('join_room', roomId);
  }

  public leaveRoom(roomId: number): void {
    if (!this.isConnected()) {
      console.error('❌ Cannot leave room - socket not connected');
      return;
    }
    this.socket!.emit('leave_room', roomId);
  }

  public sendMessage(
    roomId: number,
    content: string,
    type: string = 'text',
    replyTo?: number
  ): void {
    if (!this.isConnected()) {
      console.error('❌ Cannot send message - socket not connected');
      return;
    }

    console.log('💬 Sending message...');
    console.log('📋 Room ID:', roomId);
    console.log('💬 Content:', content);
    
    this.socket!.emit('send_message', {
      roomId,
      content,
      type,
      replyTo,
    });
    console.log('✅ Message sent via Socket.IO');
  }

  public startTyping(roomId: number): void {
    if (this.isConnected()) {
      this.socket!.emit('typing_start', { roomId });
    }
  }

  public stopTyping(roomId: number): void {
    if (this.isConnected()) {
      this.socket!.emit('typing_stop', { roomId });
    }
  }

  public addReaction(messageId: number, reactionType: string): void {
    if (this.isConnected()) {
      this.socket!.emit('add_reaction', {
        messageId,
        reactionType,
      });
    }
  }

  public createRoom(roomData: {
    name: string;
    description?: string;
    type?: string;
    isPublic?: boolean;
    memberIds?: number[];
  }): void {
    if (this.isConnected()) {
      this.socket!.emit('create_room', roomData);
    }
  }

  // Observable-based event listeners
  
  public onJoinedRoom(): Observable<{ roomId: number; success: boolean }> {
    return new Observable((observer) => {
      if (this.socket) {
        this.socket.on('joined_room', (data) => observer.next(data));
      }
    });
  }

  public onLeftRoom(): Observable<{ roomId: number }> {
    return new Observable((observer) => {
      if (this.socket) {
        this.socket.on('left_room', (data) => observer.next(data));
      }
    });
  }

  /**
   * Force reconnection (useful for manual retry)
   */
  public forceReconnect(): void {
    console.log('🔄 Force reconnecting...');
    this.disconnect();
    this.connectionRetryCount = 0;
    this.connect();
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
      connectionStatus: this.connectionStatus.value,
      user: this.currentUser,
      retryCount: this.connectionRetryCount,
      hasToken: !!this.getAuthToken()
    };
  }

  /**
   * Cleanup on service destroy
   */
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
