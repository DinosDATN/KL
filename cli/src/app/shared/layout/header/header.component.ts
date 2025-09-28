import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  showCompactSticky = false;
  private observer?: IntersectionObserver;
  @ViewChild('sentinel', { static: true }) sentinelRef!: ElementRef;

  // Authentication state
  currentUser: User | null = null;
  isAuthenticated = false;
  private authSubscription?: Subscription;

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
    if (this.observer) this.observer.disconnect();
    if (this.authSubscription) this.authSubscription.unsubscribe();
  }
  notificationsUnread(): boolean {
    return this.notifications.some((n) => !n.read);
  }
  isMenuOpen = false;
  isUserMenuOpen = false;
  isNotificationOpen = false;
  activeDropdown: string | null = null;
  // Removed hover-related properties for click-only functionality
  notifications = [
    {
      id: 1,
      title: 'Chào mừng bạn đến với L-FYS!',
      time: '1 phút trước',
      read: false,
    },
    {
      id: 2,
      title: 'Bạn có bài tập mới cần làm.',
      time: '10 phút trước',
      read: false,
    },
    {
      id: 3,
      title: 'Cập nhật hệ thống thành công.',
      time: '1 giờ trước',
      read: true,
    },
  ];

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) {
    // Subscribe to authentication state changes
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAuthenticated = !!user;

      // Update user menu items based on authentication state
      this.updateUserMenuItems();
    });
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

  userMenuItems: MenuItem[] = [
    { label: 'Hồ sơ', link: '/profile', icon: 'user' },
    { label: 'Cài đặt', link: '/settings', icon: 'settings' },
    { label: 'Đăng xuất', link: '/logout', icon: 'log-out' },
  ];

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
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }

  removeNotification(id: number): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
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

  updateUserMenuItems(): void {
    if (this.isAuthenticated) {
      this.userMenuItems = [
        { label: 'Hồ sơ', link: '/profile', icon: 'user' },
        { label: 'Cài đặt', link: '/settings', icon: 'settings' },
        { label: 'Đăng xuất', link: '#', icon: 'log-out', action: 'logout' },
      ];
    } else {
      this.userMenuItems = [
        { label: 'Đăng nhập', link: '/auth/login', icon: 'log-in' },
        { label: 'Đăng ký', link: '/auth/register', icon: 'user-plus' },
      ];
    }
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
