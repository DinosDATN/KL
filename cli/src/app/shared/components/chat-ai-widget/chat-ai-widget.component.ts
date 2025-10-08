import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatAIService } from '../../../core/services/chat-ai.service';
import { ChatAIMessage } from '../../../core/models/ai.model';

@Component({
  selector: 'app-chat-ai-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-ai-widget.component.html',
  styleUrls: ['./chat-ai-widget.component.css']
})
export class ChatAiWidgetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // UI State
  isOpen = false;
  isLoading = false;
  messages: ChatAIMessage[] = [];
  currentMessage = '';
  showQuickQuestions = true;
  
  // Quick questions
  quickQuestions: string[] = [];

  constructor(
    private chatAIService: ChatAIService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeWidget();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeWidget(): void {
    // Subscribe to chat state changes
    this.chatAIService.isOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => {
        this.isOpen = isOpen;
        if (isOpen) {
          // Auto-focus input when opened
          setTimeout(() => this.focusInput(), 100);
        }
      });

    this.chatAIService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        // Auto scroll to bottom when new message arrives
        setTimeout(() => this.scrollToBottom(), 100);
      });

    this.chatAIService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoading = isLoading;
      });

    // Load quick questions
    this.quickQuestions = this.chatAIService.getQuickQuestions();
  }

  // Widget controls
  toggleChat(): void {
    this.chatAIService.toggleChat();
    
    // Hide quick questions after first interaction
    if (this.isOpen && this.showQuickQuestions && this.messages.length > 1) {
      this.showQuickQuestions = false;
    }
  }

  closeChat(): void {
    this.chatAIService.closeChat();
  }

  // Message handling
  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const message = this.currentMessage.trim();
    this.currentMessage = '';
    this.showQuickQuestions = false;

    this.chatAIService.askQuestion(message).subscribe({
      next: () => {
        // Message handled by service
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  sendQuickQuestion(question: string): void {
    this.currentMessage = question;
    this.sendMessage();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Chat actions
  clearChat(): void {
    this.chatAIService.clearChat();
    this.showQuickQuestions = true;
  }

  exportChat(): void {
    const chatHistory = this.chatAIService.exportChatHistory();
    this.downloadTextFile(chatHistory, `chat-history-${new Date().getTime()}.txt`);
  }

  private downloadTextFile(content: string, filename: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }

  // UI Helpers
  private scrollToBottom(): void {
    if (isPlatformBrowser(this.platformId)) {
      const messagesContainer = document.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }

  private focusInput(): void {
    if (isPlatformBrowser(this.platformId)) {
      const input = document.querySelector('.chat-input') as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }
  }

  // Message formatting
  formatMessageText(text: string): string {
    // Basic formatting for suggestions and special content
    return text
      .replace(/💡 Gợi ý câu hỏi:/g, '<strong>💡 Gợi ý câu hỏi:</strong>')
      .replace(/• /g, '• ')
      .replace(/\n/g, '<br>');
  }

  isTypingMessage(message: ChatAIMessage): boolean {
    return message.isTyping || false;
  }

  getMessageTime(message: ChatAIMessage): string {
    return message.timestamp.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Widget positioning and responsive
  getWidgetPosition(): string {
    if (isPlatformBrowser(this.platformId)) {
      const isMobile = window.innerWidth <= 768;
      return isMobile ? 'mobile' : 'desktop';
    }
    return 'desktop';
  }

  // Health check (optional for debugging)
  checkAIHealth(): void {
    this.chatAIService.checkHealth().subscribe({
      next: (health) => {
        console.log('AI Health Status:', health);
      },
      error: (error) => {
        console.error('Health check failed:', error);
      }
    });
  }

  // Track by function for messages
  trackByMessageId(index: number, message: ChatAIMessage): string {
    return message.id;
  }
}