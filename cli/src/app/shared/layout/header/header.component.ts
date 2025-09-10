// ...existing code...
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  showCompactSticky = false;
  private observer?: IntersectionObserver;
  @ViewChild('sentinel', { static: true }) sentinelRef!: ElementRef;

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
  }
  notificationsUnread(): boolean {
    return this.notifications.some((n) => !n.read);
  }
  isMenuOpen = false;
  isUserMenuOpen = false;

  isNotificationOpen = false;
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

  constructor(public themeService: ThemeService) {}

  navigationItems = [
    { label: 'Trang chủ', link: '/', icon: 'home' },
    { label: 'Khóa học', link: '/courses', icon: 'book' },
    { label: 'Bài tập', link: '/problems', icon: 'code' },
    { label: 'Tài liệu', link: '/documents', icon: 'file-text' },
    { label: 'Diễn đàn', link: '/forum', icon: 'message-circle' },
    { label: 'Xếp hạng', link: '/leaderboard', icon: 'trophy' },
  ];

  userMenuItems = [
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
}
