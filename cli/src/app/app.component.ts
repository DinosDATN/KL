import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil, filter, take, switchMap, pairwise } from 'rxjs';
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
export class AppComponent implements OnInit, OnDestroy {
  title = 'cli';
  private destroy$ = new Subject<void>();
  private isAppInitialized = false;

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private appNotificationService: AppNotificationService
  ) {}

  ngOnInit(): void {
    console.log('🚀 App component initialized');
    
    // ✅ Đợi auth initialized trước, sau đó mới listen currentUser$
    // Điều này đảm bảo AuthService đã verify session với server (qua HttpOnly cookie)
    this.authService.authInitialized$
      .pipe(
        takeUntil(this.destroy$),
        filter(initialized => initialized === true),
        take(1),
        switchMap(() => this.authService.currentUser$)
      )
      .subscribe((user) => {
        if (user) {
          console.log('✅ User authenticated (after auth initialized), initializing app');
          this.initializeApp();
        } else {
          console.log('ℹ️ No user after auth initialized');
        }
      });

    // ✅ Riêng biệt: Listen logout events
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        pairwise() // Lấy [previous, current] value
      )
      .subscribe(([prevUser, currentUser]) => {
        // Chỉ cleanup khi user logout (từ có user → không có user)
        if (prevUser && !currentUser) {
          console.log('❌ User logged out, cleaning up');
          this.isAppInitialized = false;
          this.socketService.disconnect();
          this.appNotificationService.clearData();
        }
      });

    // Log socket connection status
    this.socketService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected) => {
        console.log(`🔌 Socket connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeApp(): void {
    const user = this.authService.getCurrentUser();

    console.log('🔧 Initializing app...', { 
      hasUser: !!user,
      userName: user?.name,
      alreadyInitialized: this.isAppInitialized
    });

    if (!user) {
      console.log('⚠️ Cannot initialize app: missing user');
      this.isAppInitialized = false;
      return;
    }

    // ✅ Prevent duplicate initialization
    if (this.isAppInitialized) {
      console.log('ℹ️ App already initialized, skipping');
      return;
    }

    // ✅ Token is in HttpOnly cookie, Socket.IO will send it automatically
    // Initialize socket connection
    if (!this.socketService.isConnected()) {
      console.log('🚀 Initializing socket connection from app component');
      console.log(`👤 User: ${user.name} (ID: ${user.id})`);
      console.log('🍪 Socket.IO will use HttpOnly cookie for authentication');
      
      // ✅ Pass empty string as token - cookie will be sent automatically
      this.socketService.connect('', user);
      
      // Wait a bit for socket to connect before loading notifications
      setTimeout(() => {
        this.loadNotifications();
      }, 500);
    } else {
      console.log('✅ Socket already connected, loading notifications');
      this.loadNotifications();
    }

    // Mark as initialized
    this.isAppInitialized = true;
  }

  private loadNotifications(): void {
    // Load notifications
    console.log('📬 Loading notifications');
    this.appNotificationService.loadNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          console.log(`✅ Loaded ${notifications.length} notifications`);
        },
        error: (error) => {
          console.error('❌ Error loading notifications:', error);
        }
      });

    // Load unread count
    this.appNotificationService.loadUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          console.log(`📊 Unread notifications: ${count}`);
        },
        error: (error) => {
          console.error('❌ Error loading unread count:', error);
        }
      });
  }
}
