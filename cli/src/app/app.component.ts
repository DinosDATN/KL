import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil, filter, take, switchMap } from 'rxjs';
import { ChatAiWidgetComponent } from './shared/components/chat-ai-widget/chat-ai-widget.component';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { AppNotificationService } from './core/services/app-notification.service';
import { environment } from '../environments/environment';

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
    // Wait for auth initialization, then listen to user changes
    this.authService.authInitialized$
      .pipe(
        filter(initialized => initialized === true),
        take(1),
        switchMap(() => this.authService.currentUser$),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        if (user && !this.isAppInitialized) {
          // User logged in, initialize app
          if (environment.enableLogging) {
            console.log('[App] User authenticated, initializing...');
          }
          this.initializeApp();
        } else if (!user && this.isAppInitialized) {
          // User logged out, cleanup
          if (environment.enableLogging) {
            console.log('[App] User logged out, cleaning up...');
          }
          this.cleanup();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeApp(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Connect socket (HttpOnly cookie sent automatically)
    this.socketService.connect('', user);
    
    // Load notifications after socket connects
    setTimeout(() => {
      this.loadNotifications();
    }, 500);

    this.isAppInitialized = true;
    
    if (environment.enableLogging) {
      console.log('[App] Initialized for user:', user.name);
    }
  }

  private cleanup(): void {
    this.isAppInitialized = false;
    this.socketService.disconnect();
    this.appNotificationService.clearData();
  }

  private loadNotifications(): void {
    this.appNotificationService.loadNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          if (environment.enableLogging) {
            console.error('[App] Failed to load notifications:', error);
          }
        }
      });

    this.appNotificationService.loadUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          if (environment.enableLogging) {
            console.error('[App] Failed to load unread count:', error);
          }
        }
      });
  }
}
