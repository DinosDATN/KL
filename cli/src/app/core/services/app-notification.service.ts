import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, tap, takeUntil } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: number;
  user_id: number;
  type: 'friend_request' | 'friend_accepted' | 'friend_declined' | 'room_invite' | 'room_created' | 'message' | 'system' | 'achievement' | 'contest';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppNotificationService implements OnDestroy {
  private apiUrl = environment.production ? environment.apiUrl : 'http://localhost:3000/api/v1';
  private destroy$ = new Subject<void>();

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.initializeSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSocketListeners(): void {
    console.log('🔧 AppNotificationService: Initializing socket listeners');

    // Listen for friend request received
    this.socketService.friendRequestReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('📬 AppNotificationService: Friend request received', data);
        this.loadUnreadCount().subscribe();
        this.loadNotifications().subscribe();
      });

    // Listen for friend request accepted
    this.socketService.friendRequestAccepted$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('✅ AppNotificationService: Friend request accepted', data);
        this.loadUnreadCount().subscribe();
        this.loadNotifications().subscribe();
      });

    // Listen for friend request declined
    this.socketService.friendRequestDeclined$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('❌ AppNotificationService: Friend request declined', data);
        this.loadUnreadCount().subscribe();
        this.loadNotifications().subscribe();
      });

    // Listen for room invites
    this.socketService.notification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (notification && notification.type === 'room_invite') {
          console.log('🏠 AppNotificationService: Room invite received', notification);
          this.loadUnreadCount().subscribe();
          this.loadNotifications().subscribe();
        }
      });
  }

  // Load notifications
  loadNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): Observable<AppNotification[]> {
    let url = `${this.apiUrl}/notifications?page=${page}&limit=${limit}`;
    if (unreadOnly) {
      url += '&unreadOnly=true';
    }

    return this.http.get<{success: boolean, data: {notifications: AppNotification[], totalCount: number}}>(url)
      .pipe(
        map(response => response.data.notifications),
        tap(notifications => {
          if (page === 1) {
            this.notificationsSubject.next(notifications);
          } else {
            const current = this.notificationsSubject.value;
            this.notificationsSubject.next([...current, ...notifications]);
          }
        })
      );
  }

  // Load unread count
  loadUnreadCount(): Observable<number> {
    return this.http.get<{success: boolean, data: {count: number}}>(`${this.apiUrl}/notifications/unread-count`)
      .pipe(
        map(response => response.data.count),
        tap(count => {
          this.unreadCountSubject.next(count);
        })
      );
  }

  // Mark notification as read
  markAsRead(notificationId: number): Observable<AppNotification> {
    return this.http.put<{success: boolean, data: AppNotification}>(
      `${this.apiUrl}/notifications/${notificationId}/read`,
      {}
    ).pipe(
      map(response => response.data),
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value;
        const updated = notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        this.notificationsSubject.next(updated);
        
        // Update unread count
        const currentCount = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, currentCount - 1));
      })
    );
  }

  // Mark all as read
  markAllAsRead(): Observable<{updatedCount: number}> {
    return this.http.put<{success: boolean, data: {updatedCount: number}}>(
      `${this.apiUrl}/notifications/read-all`,
      {}
    ).pipe(
      map(response => response.data),
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value;
        const updated = notifications.map(n => ({ ...n, is_read: true }));
        this.notificationsSubject.next(updated);
        
        // Reset unread count
        this.unreadCountSubject.next(0);
      })
    );
  }

  // Delete notification
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<{success: boolean}>(
      `${this.apiUrl}/notifications/${notificationId}`
    ).pipe(
      map(() => void 0),
      tap(() => {
        // Update local state
        const notifications = this.notificationsSubject.value;
        const notification = notifications.find(n => n.id === notificationId);
        const updated = notifications.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(updated);
        
        // Update unread count if notification was unread
        if (notification && !notification.is_read) {
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
        }
      })
    );
  }

  // Delete all read notifications
  deleteAllRead(): Observable<{deletedCount: number}> {
    return this.http.delete<{success: boolean, data: {deletedCount: number}}>(
      `${this.apiUrl}/notifications/read/all`
    ).pipe(
      map(response => response.data),
      tap(() => {
        // Update local state - keep only unread notifications
        const notifications = this.notificationsSubject.value;
        const updated = notifications.filter(n => !n.is_read);
        this.notificationsSubject.next(updated);
      })
    );
  }

  // Get current notifications
  getNotifications(): AppNotification[] {
    return this.notificationsSubject.value;
  }

  // Get current unread count
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  // Clear data (for logout)
  clearData(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
}
