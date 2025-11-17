import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatAiWidgetComponent } from './shared/components/chat-ai-widget/chat-ai-widget.component';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { AppNotificationService } from './core/services/app-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatAiWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'cli';

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private appNotificationService: AppNotificationService
  ) {}

  ngOnInit(): void {
    // Initialize socket connection and notifications if user is authenticated
    this.initializeApp();

    // Listen for auth state changes
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        console.log('✅ User authenticated, initializing app');
        this.initializeApp();
      } else {
        console.log('❌ User logged out, cleaning up');
        this.socketService.disconnect();
        this.appNotificationService.clearData();
      }
    });
  }

  private initializeApp(): void {
    const user = this.authService.getCurrentUser();
    const token = this.authService.getToken();

    if (user && token) {
      // Initialize socket connection
      if (!this.socketService.isConnected()) {
        console.log('🚀 Initializing socket connection from app component');
        this.socketService.connect(token, user);
      }

      // Load notifications
      console.log('📬 Loading notifications');
      this.appNotificationService.loadNotifications().subscribe({
        next: (notifications) => {
          console.log(`✅ Loaded ${notifications.length} notifications`);
        },
        error: (error) => {
          console.error('❌ Error loading notifications:', error);
        }
      });

      // Load unread count
      this.appNotificationService.loadUnreadCount().subscribe({
        next: (count) => {
          console.log(`📊 Unread notifications: ${count}`);
        },
        error: (error) => {
          console.error('❌ Error loading unread count:', error);
        }
      });
    }
  }
}
