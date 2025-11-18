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
    console.log('🚀 App component initialized');
    
    // Đợi auth initialized trước khi init app
    this.authService.authInitialized$.subscribe((initialized) => {
      if (initialized) {
        console.log('✅ Auth initialized, initializing app');
        this.initializeApp();
      }
    });

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

    // Log socket connection status
    this.socketService.isConnected$.subscribe((connected) => {
      console.log(`🔌 Socket connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
    });
  }

  private initializeApp(): void {
    const user = this.authService.getCurrentUser();

    console.log('🔧 Initializing app...', { 
      hasUser: !!user,
      userName: user?.name 
    });

    if (user) {
      // ✅ Token is in HttpOnly cookie, we just need user data
      // Initialize socket connection
      if (!this.socketService.isConnected()) {
        console.log('🚀 Initializing socket connection from app component');
        console.log(`👤 User: ${user.name} (ID: ${user.id})`);
        
        // ⚠️ Socket.IO needs token - we'll need to update socket connection
        // For now, pass empty string as token (socket will use cookie)
        this.socketService.connect('', user);
        
        // Wait a bit for socket to connect before loading notifications
        setTimeout(() => {
          this.loadNotifications();
        }, 500);
      } else {
        console.log('✅ Socket already connected, loading notifications');
        this.loadNotifications();
      }
    } else {
      console.log('⚠️ Cannot initialize app: missing user');
    }
  }

  private loadNotifications(): void {
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
