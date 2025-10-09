import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatAIService } from '../../../core/services/chat-ai.service';
import { ChatAIMessage } from '../../../core/models/ai.model';

@Component({
  selector: 'app-chat-ai-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-ai-widget.component.html',
  styleUrl: './chat-ai-widget.component.css',
})
export class ChatAiWidgetComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @ViewChild('messagesContainer', { static: false })
  messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  // Component state
  isOpen = false;
  isLoading = false;
  isHealthy = true;
  hasNewMessage = false;
  isMobile = false;

  // Chat data
  messages: ChatAIMessage[] = [];
  currentMessage = '';
  quickQuestions: string[] = [];

  // UI computed properties
  get canSend(): boolean {
    return this.currentMessage.trim().length > 0 && !this.isLoading;
  }

  get statusText(): string {
    if (!this.isHealthy) return 'Offline';
    if (this.isLoading) return 'Đang trả lời...';
    return 'Trực tuyến';
  }

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(private chatAIService: ChatAIService) {}

  ngOnInit(): void {
    this.detectMobile();
    this.setupSubscriptions();
    this.loadQuickQuestions();
    this.checkHealthStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.detectMobile();
  }

  private detectMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private setupSubscriptions(): void {
    // Subscribe to chat messages
    const messagesSubscription = this.chatAIService.messages$.subscribe(
      (messages) => {
        this.messages = messages;
        this.shouldScrollToBottom = true;

        // Check for new messages when chat is closed
        if (!this.isOpen && messages.length > 1) {
          this.hasNewMessage = true;
        }
      }
    );

    // Subscribe to chat open state
    const isOpenSubscription = this.chatAIService.isOpen$.subscribe(
      (isOpen) => {
        this.isOpen = isOpen;
        if (isOpen) {
          this.hasNewMessage = false;
          setTimeout(() => this.focusInput(), 100);
        }
      }
    );

    // Subscribe to loading state
    const loadingSubscription = this.chatAIService.isLoading$.subscribe(
      (isLoading) => {
        this.isLoading = isLoading;
      }
    );

    this.subscriptions.push(
      messagesSubscription,
      isOpenSubscription,
      loadingSubscription
    );
  }

  private loadQuickQuestions(): void {
    this.quickQuestions = this.chatAIService.getQuickQuestions();
  }

  private checkHealthStatus(): void {
    this.chatAIService.checkHealth().subscribe({
      next: (response) => {
        this.isHealthy = response.success && response.data.status === 'healthy';
      },
      error: () => {
        this.isHealthy = false;
      },
    });
  }

  // Chat controls
  toggleChat(): void {
    this.chatAIService.toggleChat();
  }

  closeChat(): void {
    this.chatAIService.closeChat();
  }

  openChat(): void {
    this.chatAIService.openChat();
  }

  // Message handling
  sendMessage(): void {
    if (!this.canSend) return;

    const message = this.currentMessage.trim();
    this.currentMessage = '';
    this.resizeTextarea();

    this.chatAIService.askQuestion(message).subscribe({
      next: () => {
        // Success handled by service
      },
      error: (error) => {
        console.error('Failed to send message:', error);
      },
    });
  }

  askQuickQuestion(question: string): void {
    this.chatAIService.askQuickQuestion(question);
  }

  clearChat(): void {
    this.chatAIService.clearChat();
  }

  exportChat(): void {
    const chatHistory = this.chatAIService.exportChatHistory();
    this.downloadFile(chatHistory, 'chat-history.txt', 'text/plain');
  }

  // Input handling
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }

    setTimeout(() => this.resizeTextarea(), 0);
  }

  private resizeTextarea(): void {
    if (!this.messageInput) return;

    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max 5 lines
    textarea.style.height = newHeight + 'px';
  }

  private focusInput(): void {
    if (!this.messageInput || this.isMobile) return;
    this.messageInput.nativeElement.focus();
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) return;

    try {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.warn('Could not scroll to bottom:', err);
    }
  }

  // Utility methods
  formatMessage(text: string): string {
    // Convert line breaks to <br> tags
    let formatted = text.replace(/\n/g, '<br>');

    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return formatted;
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();

    if (diff < 60000) {
      // Less than 1 minute
      return 'Vừa xong';
    } else if (diff < 3600000) {
      // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes} phút trước`;
    } else if (diff < 86400000) {
      // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours} giờ trước`;
    } else {
      return timestamp.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  trackByMessage(index: number, message: ChatAIMessage): string {
    return message.id;
  }

  trackByQuestion(index: number, question: string): string {
    return question;
  }

  private downloadFile(
    content: string,
    filename: string,
    contentType: string
  ): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
