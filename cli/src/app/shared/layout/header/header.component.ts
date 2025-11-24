import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { UserStatsBadgeComponent } from '../../components/user-stats-badge/user-stats-badge.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { filter, Subject, Subscription, switchMap, take, takeUntil, Observable } from 'rxjs';
import { AppNotificationService, AppNotification } from '../../../core/services/app-notification.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserStatsService } from '../../../core/services/user-stats.service';
import { UserStats, LevelProgress } from '../../../core/models/user-stats.model';

interface MenuItem {
  label: string;
  link: string;
  icon: string;
  action?: string;
}

interface NavigationItem {
  label: string;
  link?: string;
  icon: string;
  children?: NavigationItem[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserStatsBadgeComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  showCompactSticky = false;
  private observer?: IntersectionObserver;
  @ViewChild('sentinel', { static: true }) sentinelRef!: ElementRef;

  // Platform detection
  isBrowser: boolean;

  // Authentication state - use observables for async pipe
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  authInitialized$: Observable<boolean>;
  
  // Legacy properties for backward compatibility (minimal usage)
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && this.sentinelRef) {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.showCompactSticky = !entry.isIntersecting;
        },
        { threshold: 0.01 }
      );
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.observer) this.observer.disconnect();
    if (this.notificationSubscription) this.notificationSubscription.unsubscribe();
    if (this.unreadCountSubscription) this.unreadCountSubscription.unsubscribe();
    if (this.statsSubscription) this.statsSubscription.unsubscribe();
  }

  isMenuOpen = false;
  isUserMenuOpen = false;
  isNotificationOpen = false;
  activeDropdown: string | null = null;
  
  // Notification state
  notifications: AppNotification[] = [];
  unreadCount = 0;
  private notificationSubscription?: Subscription;
  private unreadCountSubscription?: Subscription;
  private previousUnreadCount = -1; // -1 means not initialized yet

  // User stats state
  userStats: UserStats | null = null;
  levelProgress: LevelProgress | null = null;
  private statsSubscription?: Subscription;

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
    private appNotificationService: AppNotificationService,
    private notificationService: NotificationService,
    private userStatsService: UserStatsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // ✅ Setup observables for async pipe
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.authInitialized$ = this.authService.authInitialized$;

    // ✅ Only setup subscriptions in browser
    if (this.isBrowser) {
      // Wait for auth initialization, then subscribe to user changes
      this.authService.authInitialized$
        .pipe(
          filter(initialized => initialized === true),
          take(1),
          switchMap(() => this.authService.currentUser$),
          takeUntil(this.destroy$)
        )
        .subscribe((user) => {
          this.currentUser = user; // Keep for legacy compatibility

          if (user) {
            this.subscribeToNotifications();
            this.loadUserStats();
          } else {
            this.unsubscribeFromNotifications();
            this.clearUserStats();
          }
        });
    }

  }

  private loadUserStats(): void {
    // Load initial stats
    this.userStatsService.loadUserStats().subscribe({
      next: () => {
        console.log('✅ User stats loaded');
      },
      error: (error) => {
        console.error('❌ Error loading user stats:', error);
      }
    });

    // Subscribe to stats updates
    this.statsSubscription = this.userStatsService.userStats$.subscribe(
      (stats) => {
        this.userStats = stats;
        if (stats) {
          this.levelProgress = this.userStatsService.calculateLevelProgress(stats);
        } else {
          this.levelProgress = null;
        }
      }
    );
  }

  private clearUserStats(): void {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
    this.userStatsService.clearStats();
    this.userStats = null;
    this.levelProgress = null;
  }

  private subscribeToNotifications(): void {
    // Subscribe to notifications list
    this.notificationSubscription = this.appNotificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      }
    );

    // Subscribe to unread count with toast notification on new notifications
    this.unreadCountSubscription = this.appNotificationService.unreadCount$.subscribe(
      (count) => {
        // Show toast if unread count increased (new notification)
        // Skip the first emission (initial load) by checking if previousUnreadCount is initialized
        const isFirstLoad = this.previousUnreadCount === -1;
        
        if (!isFirstLoad && count > this.previousUnreadCount) {
          console.log(`📊 Unread count increased: ${this.previousUnreadCount} → ${count}`);
          const newNotifications = this.notifications.filter(n => !n.is_read).slice(0, count - this.previousUnreadCount);
          if (newNotifications.length > 0) {
            const latestNotification = newNotifications[0];
            
            // Show toast with appropriate icon based on notification type
            console.log('🔔 Showing toast notification:', latestNotification.title);
            
            this.notificationService.info(
              `🔔 ${latestNotification.title}`,
              latestNotification.message,
              5000
            );
          }
        } else if (isFirstLoad) {
          console.log(`📊 First load: initializing unread count to ${count}`);
        }
        
        // Update previousUnreadCount
        this.previousUnreadCount = count;
        this.unreadCount = count;
      }
    );
  }

  private unsubscribeFromNotifications(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.unreadCountSubscription) {
      this.unreadCountSubscription.unsubscribe();
    }
    this.notifications = [];
    this.unreadCount = 0;
    this.previousUnreadCount = -1; // Reset to uninitialized state
  }

  navigationItems: NavigationItem[] = [
    { label: 'Trang chủ', link: '/', icon: 'home' },
    {
      label: 'Học tập',
      icon: 'book',
      children: [
        { label: 'Khóa học', link: '/courses', icon: 'book' },
        { label: 'Bài tập', link: '/problems', icon: 'code' },
        { label: 'Tài liệu', link: '/documents', icon: 'file-text' },
      ],
    },
    {
      label: 'Thi đấu',
      icon: 'award',
      children: [
        { label: 'Cuộc thi', link: '/contests', icon: 'award' },
        { label: 'Xếp hạng', link: '/leaderboard', icon: 'trophy' },
      ],
    },
    {
      label: 'Gamification',
      icon: 'game',
      children: [{ label: 'Sudoku', link: '/games/sudoku', icon: 'grid' }],
    },
    {
      label: 'Diễn đàn',
      // link: '/forum',
      icon: 'message-circle',
      children: [
        { label: 'Diễn đàn', link: '/forum/', icon: 'message-circle' },
        { label: 'Chat', link: '/chat', icon: 'users' },
      ],
    },
  ];

  // Flattened items for mobile menu
  get flatNavigationItems(): NavigationItem[] {
    const flatItems: NavigationItem[] = [];
    this.navigationItems.forEach((item) => {
      if (item.children) {
        flatItems.push(...item.children);
      } else {
        flatItems.push(item);
      }
    });
    return flatItems;
  }

  get userMenuItems(): MenuItem[] {
    const currentUser = this.authService.getCurrentUser();
    
    // Determine profile link based on user role
    const profileLink = (currentUser?.role === 'creator' || currentUser?.role === 'admin') 
      ? '/creator/profile' 
      : '/profile';

    const items: MenuItem[] = [
      { label: 'Hồ sơ', link: profileLink, icon: 'user' },
    ];

    // Add creator/admin specific items
    if (currentUser && (currentUser.role === 'creator' || currentUser.role === 'admin')) {
      items.push(
        { label: 'Quản lý khóa học', link: '/creator/courses', icon: 'book' },
        { label: 'Quản lý cuộc thi', link: '/creator/contests', icon: 'trophy' }
      );
    }

    // Add admin panel for admin
    if (currentUser?.role === 'admin') {
      items.push(
        { label: 'Admin Panel', link: '/admin/dashboard', icon: 'settings' }
      );
    }

    items.push(
      { label: 'Cài đặt', link: '/settings', icon: 'settings' },
      { label: 'Đăng xuất', link: '/logout', icon: 'log-out', action: 'logout' }
    );

    return items;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeMenus(): void {
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
    this.activeDropdown = null;
  }

  // Simplified click-only dropdown methods
  onDropdownToggle(itemLabel: string, event: Event): void {
    event.stopPropagation();

    // Toggle dropdown state
    if (this.activeDropdown === itemLabel) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = itemLabel;
    }
  }

  isDropdownOpen(itemLabel: string): boolean {
    return this.activeDropdown === itemLabel;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Check if click is outside the dropdown area
    if (!target.closest('.dropdown-container')) {
      this.activeDropdown = null;
    }
  }

  toggleNotification(): void {
    this.isNotificationOpen = !this.isNotificationOpen;
  }

  closeNotification(): void {
    this.isNotificationOpen = false;
  }

  markAllAsRead(): void {
    this.appNotificationService.markAllAsRead().subscribe({
      next: () => {
        console.log('✅ All notifications marked as read');
      },
      error: (error) => {
        console.error('❌ Error marking all as read:', error);
        this.notificationService.error('Lỗi', 'Không thể đánh dấu tất cả đã đọc');
      }
    });
  }

  markAsRead(notification: AppNotification): void {
    if (!notification.is_read) {
      this.appNotificationService.markAsRead(notification.id).subscribe({
        next: () => {
          console.log('✅ Notification marked as read:', notification.id);
        },
        error: (error) => {
          console.error('❌ Error marking as read:', error);
        }
      });
    }
  }

  removeNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.appNotificationService.deleteNotification(id).subscribe({
      next: () => {
        console.log('✅ Notification deleted:', id);
      },
      error: (error) => {
        console.error('❌ Error deleting notification:', error);
        this.notificationService.error('Lỗi', 'Không thể xóa thông báo');
      }
    });
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'friend_request': 'user-plus',
      'friend_accepted': 'user-check',
      'friend_declined': 'user-x',
      'room_invite': 'users',
      'room_created': 'message-circle',
      'message': 'mail',
      'system': 'info',
      'achievement': 'award',
      'contest': 'trophy'
    };
    return iconMap[type] || 'bell';
  }

  getNotificationColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'friend_request': 'text-blue-500',
      'friend_accepted': 'text-green-500',
      'friend_declined': 'text-red-500',
      'room_invite': 'text-purple-500',
      'room_created': 'text-indigo-500',
      'message': 'text-yellow-500',
      'system': 'text-gray-500',
      'achievement': 'text-orange-500',
      'contest': 'text-pink-500'
    };
    return colorMap[type] || 'text-gray-500';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }

  onNotificationClick(notification: AppNotification): void {
    // Mark as read
    this.markAsRead(notification);

    // Navigate based on notification type
    if (notification.data) {
      switch (notification.type) {
        case 'friend_request':
          this.router.navigate(['/chat'], { queryParams: { tab: 'friends' } });
          break;
        case 'friend_accepted':
          this.router.navigate(['/chat'], { queryParams: { tab: 'friends' } });
          break;
        case 'room_invite':
        case 'room_created':
          if (notification.data.room_id) {
            this.router.navigate(['/chat'], { queryParams: { room: notification.data.room_id } });
          }
          break;
        default:
          // Do nothing for other types
          break;
      }
    }

    this.closeNotification();
  }

  // Authentication methods
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still navigate to login even if logout fails
        this.router.navigate(['/auth/login']);
      },
    });
  }


  onUserMenuItemClick(item: MenuItem): void {
    if (item.action === 'logout') {
      this.logout();
    } else {
      this.router.navigate([item.link]);
    }
    this.closeMenus();
  }
}
