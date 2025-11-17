import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, tap, catchError, takeUntil } from 'rxjs/operators';
import {
  PrivateConversation,
  PrivateMessage,
  ConversationListResponse,
  MessageListResponse,
  UnreadCountResponse
} from '../models/private-chat.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SocketService } from './socket.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrivateChatService {
  private apiUrl = environment.production ? environment.apiUrl : 'http://localhost:3000/api/v1';
  
  // State management
  private conversationsSubject = new BehaviorSubject<PrivateConversation[]>([]);
  private messagesSubject = new BehaviorSubject<{[conversationId: number]: PrivateMessage[]}>({});
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private activeConversationSubject = new BehaviorSubject<PrivateConversation | null>(null);
  private typingUsersSubject = new BehaviorSubject<{[conversationId: number]: User[]}>({});
  private destroy$ = new Subject<void>();
  
  // Public observables
  public conversations$ = this.conversationsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public activeConversation$ = this.activeConversationSubject.asObservable();
  public typingUsers$ = this.typingUsersSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private socketService: SocketService
  ) {
    this.loadInitialData();
    this.initializeSocketListeners();
  }
  
  // Initialize data
  private loadInitialData(): void {
    if (this.authService.isAuthenticated()) {
      this.loadConversations().subscribe();
      this.loadUnreadCount().subscribe();
    }
  }

  // Initialize Socket.IO listeners
  private initializeSocketListeners(): void {
    // Listen for new private messages
    this.socketService.listen('new_private_message')
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: PrivateMessage) => {
        if (message) {
          console.log('📬 PrivateChat: New message received', message);
          this.addMessageToConversation(message.conversation_id, message);
          this.updateConversationLastActivity(message.conversation_id, message);
          this.loadUnreadCount().subscribe();
        }
      });

    // Listen for private typing indicators
    this.socketService.listen('private_user_typing')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: {userId: number, username: string, conversationId: number}) => {
        if (data) {
          this.addTypingUser(data.conversationId, {
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
          } as User);
        }
      });

    this.socketService.listen('private_user_stop_typing')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: {userId: number, conversationId: number}) => {
        if (data) {
          this.removeTypingUser(data.conversationId, data.userId);
        }
      });
  }
  
  // Conversation management
  loadConversations(page: number = 1, limit: number = 20): Observable<PrivateConversation[]> {
    const url = `${this.apiUrl}/private-chat/conversations?page=${page}&limit=${limit}`;
    
    return this.http.get<{success: boolean, data: ConversationListResponse}>(url).pipe(
      map(response => response.data.conversations),
      tap(conversations => {
        if (page === 1) {
          this.conversationsSubject.next(conversations);
        } else {
          const currentConversations = this.conversationsSubject.value;
          this.conversationsSubject.next([...currentConversations, ...conversations]);
        }
      })
    );
  }
  
  getOrCreateConversation(otherUserId: number): Observable<PrivateConversation> {
    return this.http.post<{success: boolean, data: PrivateConversation}>(
      `${this.apiUrl}/private-chat/conversations/with/${otherUserId}`,
      {}
    ).pipe(
      map(response => response.data),
      tap(conversation => {
        const conversations = this.conversationsSubject.value;
        const existingIndex = conversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex === -1) {
          this.conversationsSubject.next([conversation, ...conversations]);
          
          // Join the new conversation room via socket
          this.socketService.emit('join_private_conversation', {
            conversationId: conversation.id
          });
        }
        
        this.activeConversationSubject.next(conversation);
      })
    );
  }
  
  // Message management
  loadConversationMessages(conversationId: number, page: number = 1, limit: number = 50): Observable<PrivateMessage[]> {
    const url = `${this.apiUrl}/private-chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`;
    
    return this.http.get<{success: boolean, data: MessageListResponse}>(url).pipe(
      map(response => response.data.messages),
      tap(messages => {
        const currentMessages = this.messagesSubject.value;
        
        if (page === 1) {
          currentMessages[conversationId] = messages;
        } else {
          const existingMessages = currentMessages[conversationId] || [];
          currentMessages[conversationId] = [...messages, ...existingMessages];
        }
        
        this.messagesSubject.next({...currentMessages});
      })
    );
  }
  
  sendMessage(conversationId: number, content: string): Observable<PrivateMessage> {
    console.log('🚀 PrivateChat: Sending message via Socket.IO only');
    
    // Send via Socket.IO for real-time delivery (this will save to DB)
    this.socketService.emit('send_private_message', {
      conversationId,
      content: content.trim()
    });
    
    // Return a resolved observable since Socket.IO handles the DB save
    // The real message will come back via Socket.IO listener
    return new Observable<PrivateMessage>(observer => {
      // Create a temporary message for immediate response
      const tempMessage: PrivateMessage = {
        id: Date.now(), // Temporary ID
        conversation_id: conversationId,
        sender_id: 0, // Will be set properly when real message comes back
        receiver_id: 0,
        content: content.trim(),
        message_type: 'text',
        file_url: null,
        file_name: null,
        file_size: null,
        reply_to_message_id: null,
        is_edited: false,
        edited_at: null,
        is_deleted: false,
        deleted_at: null,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        read_status: 'sent'
      };
      
      observer.next(tempMessage);
      observer.complete();
    });
  }

  sendMessageWithFile(
    conversationId: number,
    content: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
    messageType: string = 'file'
  ): void {
    console.log('🚀 PrivateChat: Sending file message via Socket.IO');
    
    // Send via Socket.IO for real-time delivery (this will save to DB)
    this.socketService.emit('send_private_message', {
      conversationId,
      content: content.trim() || fileName || 'Đã gửi file',
      message_type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize
    });
  }
  
  markMessagesAsRead(conversationId: number, messageIds: number[]): Observable<void> {
    return this.http.put<{success: boolean}>(
      `${this.apiUrl}/private-chat/conversations/${conversationId}/messages/read`,
      { messageIds }
    ).pipe(
      map(() => void 0),
      tap(() => {
        this.updateLocalMessageStatuses(conversationId, messageIds, 'read');
        this.loadUnreadCount().subscribe();
      })
    );
  }
  
  loadUnreadCount(): Observable<number> {
    return this.http.get<{success: boolean, data: UnreadCountResponse}>(
      `${this.apiUrl}/private-chat/unread-count`
    ).pipe(
      map(response => response.data.unread_count),
      tap(count => this.unreadCountSubject.next(count))
    );
  }
  
  // Helper methods
  private addMessageToConversation(conversationId: number, message: PrivateMessage): void {
    const currentMessages = this.messagesSubject.value;
    if (!currentMessages[conversationId]) {
      currentMessages[conversationId] = [];
    }
    currentMessages[conversationId].push(message);
    this.messagesSubject.next({...currentMessages});
  }
  
  private updateLocalMessageStatuses(conversationId: number, messageIds: number[], status: string): void {
    const currentMessages = this.messagesSubject.value;
    const conversationMessages = currentMessages[conversationId];
    
    if (conversationMessages) {
      conversationMessages.forEach(message => {
        if (messageIds.includes(message.id)) {
          message.read_status = status as any;
        }
      });
      this.messagesSubject.next({...currentMessages});
    }
  }
  
  private updateConversationLastActivity(conversationId: number, lastMessage: PrivateMessage): void {
    const conversations = this.conversationsSubject.value;
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex !== -1) {
      conversations[conversationIndex] = {
        ...conversations[conversationIndex],
        last_message_id: lastMessage.id,
        last_activity_at: lastMessage.sent_at,
        last_message: lastMessage
      };
      
      const updatedConversation = conversations.splice(conversationIndex, 1)[0];
      conversations.unshift(updatedConversation);
      this.conversationsSubject.next([...conversations]);
    }
  }
  
  // Public utility methods
  getConversations(): PrivateConversation[] {
    return this.conversationsSubject.value;
  }
  
  getMessagesForConversation(conversationId: number): PrivateMessage[] {
    return this.messagesSubject.value[conversationId] || [];
  }
  
  getActiveConversation(): PrivateConversation | null {
    return this.activeConversationSubject.value;
  }
  
  setActiveConversation(conversation: PrivateConversation | null): void {
    // Leave previous conversation room if any
    const previousConversation = this.activeConversationSubject.value;
    if (previousConversation) {
      this.socketService.emit('leave_private_conversation', {
        conversationId: previousConversation.id
      });
    }
    
    // Join new conversation room if any
    if (conversation) {
      this.socketService.emit('join_private_conversation', {
        conversationId: conversation.id
      });
    }
    
    this.activeConversationSubject.next(conversation);
  }
  
  findConversationByParticipant(userId: number): PrivateConversation | null {
    return this.conversationsSubject.value.find(conv => 
      conv.other_participant?.id === userId
    ) || null;
  }
  
  // Typing indicators
  startTyping(conversationId: number): void {
    this.socketService.emit('private_typing_start', { conversationId });
  }

  stopTyping(conversationId: number): void {
    this.socketService.emit('private_typing_stop', { conversationId });
  }

  // Typing users management
  private addTypingUser(conversationId: number, user: User): void {
    const currentTyping = this.typingUsersSubject.value;
    if (!currentTyping[conversationId]) {
      currentTyping[conversationId] = [];
    }
    
    const existingIndex = currentTyping[conversationId].findIndex(u => u.id === user.id);
    if (existingIndex === -1) {
      currentTyping[conversationId].push(user);
      this.typingUsersSubject.next({...currentTyping});
    }
  }

  private removeTypingUser(conversationId: number, userId: number): void {
    const currentTyping = this.typingUsersSubject.value;
    if (currentTyping[conversationId]) {
      currentTyping[conversationId] = currentTyping[conversationId].filter(u => u.id !== userId);
      this.typingUsersSubject.next({...currentTyping});
    }
  }

  getTypingUsersForConversation(conversationId: number): User[] {
    return this.typingUsersSubject.value[conversationId] || [];
  }

  // Utility methods for pagination and message grouping
  getGroupedMessages(conversationId: number): { date: string; messages: PrivateMessage[] }[] {
    const messages = this.getMessagesForConversation(conversationId);
    const groups: { [key: string]: PrivateMessage[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.sent_at).toLocaleDateString('vi-VN');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  }

  getMessageTime(message: PrivateMessage): string {
    const now = new Date();
    const messageTime = new Date(message.sent_at);
    const diffInMinutes = Math.floor(
      (now.getTime() - messageTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ`;

    return messageTime.toLocaleString('vi-VN');
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  clearData(): void {
    this.conversationsSubject.next([]);
    this.messagesSubject.next({});
    this.unreadCountSubject.next(0);
    this.activeConversationSubject.next(null);
    this.typingUsersSubject.next({});
    this.destroy$.next();
    this.destroy$.complete();
  }
}
