import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, timeout, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ChatAIRequest, ChatAIResponse, ChatAIMessage, ChatAIHealthStatus, ChatAIStats, ChatAIConversationMessage } from '../models/ai.model';

@Injectable({
  providedIn: 'root'
})
export class ChatAIService {
  private readonly apiUrl = `${environment.apiUrl}/chat-ai`;
  private readonly requestTimeout = 30000; // 30 seconds

  // Chat messages state
  private messagesSubject = new BehaviorSubject<ChatAIMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  // Chat widget state
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  // Loading state
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load initial welcome message
    this.initializeChat();
  }

  private initializeChat(): void {
    const welcomeMessage: ChatAIMessage = {
      id: this.generateMessageId(),
      text: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn tìm hiểu về khóa học, bài tập, tài liệu và cuộc thi. Bạn muốn hỏi gì?',
      isUser: false,
      timestamp: new Date()
    };
    
    this.messagesSubject.next([welcomeMessage]);
  }

  // Chat widget controls
  openChat(): void {
    this.isOpenSubject.next(true);
  }

  closeChat(): void {
    this.isOpenSubject.next(false);
  }

  toggleChat(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  // Message management
  private addMessage(message: ChatAIMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  private addTypingIndicator(): string {
    const typingMessage: ChatAIMessage = {
      id: 'typing',
      text: 'Đang trả lời...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    this.addMessage(typingMessage);
    return 'typing';
  }

  private removeTypingIndicator(): void {
    const currentMessages = this.messagesSubject.value.filter(m => m.id !== 'typing');
    this.messagesSubject.next(currentMessages);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Main chat functionality with streaming
  askQuestion(question: string): Observable<ChatAIMessage> {
    if (!question.trim()) {
      return throwError('Câu hỏi không thể để trống');
    }

    // Lấy conversation history TRƯỚC KHI thêm user message mới
    // Để conversation history chỉ bao gồm các messages đã có response
    const currentMessagesBefore = this.messagesSubject.value
      .filter(m => !m.isTyping && m.id !== 'typing' && m.text && m.text.trim().length > 0)
      .slice(-20); // Chỉ lấy 20 messages gần nhất
    
    const conversationHistory: ChatAIConversationMessage[] = currentMessagesBefore.map(msg => ({
      role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.text.trim()
    })).filter(msg => msg.content.length > 0);
    
    console.log(`[ChatAI] ===== CONVERSATION HISTORY DEBUG =====`);
    console.log(`[ChatAI] Total messages in state: ${this.messagesSubject.value.length}`);
    console.log(`[ChatAI] Filtered messages: ${currentMessagesBefore.length}`);
    console.log(`[ChatAI] Prepared conversation history: ${conversationHistory.length} messages`);
    if (conversationHistory.length > 0) {
      console.log(`[ChatAI] First message:`, JSON.stringify(conversationHistory[0]));
      console.log(`[ChatAI] Last message:`, JSON.stringify(conversationHistory[conversationHistory.length - 1]));
      console.log(`[ChatAI] All messages:`, JSON.stringify(conversationHistory, null, 2));
    } else {
      console.log(`[ChatAI] WARNING: No conversation history prepared!`);
    }
    console.log(`[ChatAI] ========================================`);

    // Add user message
    const userMessage: ChatAIMessage = {
      id: this.generateMessageId(),
      text: question,
      isUser: true,
      timestamp: new Date()
    };
    this.addMessage(userMessage);

    // Remove typing indicator if exists
    this.removeTypingIndicator();
    this.isLoadingSubject.next(true);

    // Create AI message placeholder for streaming
    const aiMessageId = this.generateMessageId();
    const aiMessage: ChatAIMessage = {
      id: aiMessageId,
      text: '',
      isUser: false,
      timestamp: new Date()
    };
    this.addMessage(aiMessage);

    const request: ChatAIRequest = { 
      question: question.trim(),
      conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined
    };

    // Use streaming endpoint với POST để gửi conversation_history
    return new Observable<ChatAIMessage>(observer => {
      // Log request payload để debug
      console.log(`[ChatAI] ===== SENDING REQUEST =====`);
      console.log(`[ChatAI] Question: "${request.question}"`);
      console.log(`[ChatAI] Conversation history: ${conversationHistory.length} messages`);
      console.log(`[ChatAI] Full request payload:`, JSON.stringify(request, null, 2));
      console.log(`[ChatAI] ============================`);
      
      fetch(`${this.apiUrl}/ask-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const processStream = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              this.isLoadingSubject.next(false);
              observer.next(aiMessage);
              observer.complete();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  
                  if (data.type === 'chunk' && data.content) {
                    // Update message with new chunk
                    const currentMessages = this.messagesSubject.value;
                    const messageIndex = currentMessages.findIndex(m => m.id === aiMessageId);
                    
                    if (messageIndex !== -1) {
                      currentMessages[messageIndex].text += data.content;
                      // Create new array to trigger change detection
                      this.messagesSubject.next([...currentMessages]);
                    }
                  } else if (data.type === 'done') {
                    this.isLoadingSubject.next(false);
                    observer.next(aiMessage);
                    observer.complete();
                    return;
                  } else if (data.type === 'error') {
                    this.isLoadingSubject.next(false);
                    const errorMessage = data.content || 'Có lỗi xảy ra';
                    const currentMessages = this.messagesSubject.value;
                    const messageIndex = currentMessages.findIndex(m => m.id === aiMessageId);
                    
                    if (messageIndex !== -1) {
                      currentMessages[messageIndex].text = `❌ ${errorMessage}`;
                      this.messagesSubject.next([...currentMessages]);
                    }
                    observer.error(new Error(errorMessage));
                    return;
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }

            processStream();
          }).catch(error => {
            this.isLoadingSubject.next(false);
            this.handleError(error);
            observer.error(error);
          });
        };

        processStream();
      }).catch(error => {
        this.isLoadingSubject.next(false);
        this.handleError(error);
        observer.error(error);
      });
    });
  }

  // Clear chat history
  clearChat(): void {
    this.initializeChat();
  }

  // Health check
  checkHealth(): Observable<ChatAIHealthStatus> {
    return this.http.get<ChatAIHealthStatus>(`${this.apiUrl}/health`).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // Get statistics
  getStats(): Observable<ChatAIStats> {
    return this.http.get<ChatAIStats>(`${this.apiUrl}/stats`).pipe(
      timeout(15000),
      catchError(this.handleError)
    );
  }

  // Error handling
  private handleError(error: HttpErrorResponse | any) {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Yêu cầu không hợp lệ';
          break;
        case 408:
          errorMessage = 'Yêu cầu bị timeout. Vui lòng thử lại.';
          break;
        case 503:
          errorMessage = 'Dịch vụ AI hiện tại không khả dụng. Vui lòng thử lại sau.';
          break;
        case 500:
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
          break;
        default:
          errorMessage = error.error?.message || `Lỗi HTTP ${error.status}`;
      }
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'Yêu cầu bị timeout. Vui lòng thử lại.';
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Add error message to chat
    const errorChatMessage: ChatAIMessage = {
      id: this.generateMessageId(),
      text: `❌ Lỗi: ${errorMessage}`,
      isUser: false,
      timestamp: new Date()
    };
    this.addMessage(errorChatMessage);

    console.error('ChatAI Service Error:', error);
    return throwError(errorMessage);
  }

  // Utility methods
  exportChatHistory(): string {
    const messages = this.messagesSubject.value;
    let chatHistory = 'Chat History - ' + new Date().toISOString() + '\n\n';
    
    messages.forEach(message => {
      if (!message.isTyping) {
        const role = message.isUser ? 'Bạn' : 'AI';
        const time = message.timestamp.toLocaleString('vi-VN');
        chatHistory += `[${time}] ${role}: ${message.text}\n\n`;
      }
    });

    return chatHistory;
  }

  // Get current chat state
  getCurrentMessages(): ChatAIMessage[] {
    return this.messagesSubject.value;
  }

  isCurrentlyOpen(): boolean {
    return this.isOpenSubject.value;
  }

  isCurrentlyLoading(): boolean {
    return this.isLoadingSubject.value;
  }
}