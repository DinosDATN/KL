import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, timeout, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ChatAIRequest, ChatAIResponse, ChatAIMessage, ChatAIHealthStatus, ChatAIStats } from '../models/ai.model';

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

  // Main chat functionality
  askQuestion(question: string): Observable<ChatAIMessage> {
    if (!question.trim()) {
      return throwError('Câu hỏi không thể để trống');
    }

    // Add user message
    const userMessage: ChatAIMessage = {
      id: this.generateMessageId(),
      text: question,
      isUser: true,
      timestamp: new Date()
    };
    this.addMessage(userMessage);

    // Add typing indicator
    this.addTypingIndicator();
    this.isLoadingSubject.next(true);

    const request: ChatAIRequest = { question: question.trim() };

    return this.http.post<ChatAIResponse>(`${this.apiUrl}/ask`, request).pipe(
      timeout(this.requestTimeout),
      retry(1),
      map(response => {
        this.removeTypingIndicator();
        this.isLoadingSubject.next(false);

        if (response.success && response.data) {
          const aiMessage: ChatAIMessage = {
            id: this.generateMessageId(),
            text: response.data.answer,
            isUser: false,
            timestamp: new Date()
          };
          this.addMessage(aiMessage);

          // Add suggestions if available
          if (response.data.suggestions && response.data.suggestions.length > 0) {
            const suggestionsText = `\n\n💡 Gợi ý câu hỏi:\n${response.data.suggestions.map(s => `• ${s}`).join('\n')}`;
            const suggestionMessage: ChatAIMessage = {
              id: this.generateMessageId(),
              text: suggestionsText,
              isUser: false,
              timestamp: new Date()
            };
            this.addMessage(suggestionMessage);
          }

          return aiMessage;
        } else {
          throw new Error(response.message || 'Không thể xử lý câu hỏi của bạn');
        }
      }),
      catchError(error => {
        this.removeTypingIndicator();
        this.isLoadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  // Quick actions
  askQuickQuestion(predefinedQuestion: string): void {
    this.askQuestion(predefinedQuestion).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Quick question error:', error);
      }
    });
  }

  // Predefined quick questions
  getQuickQuestions(): string[] {
    return [
      'Có những khóa học nào?',
      'Bài tập dễ để luyện tập?',
      'Tài liệu học lập trình có gì?',
      'Cuộc thi nào đang diễn ra?',
      'Thống kê hệ thống'
    ];
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