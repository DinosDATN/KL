import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-forum-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './forum-layout.component.html',
  styleUrl: './forum-layout.component.css',
})
export class ForumLayoutComponent implements OnInit, OnDestroy {
  // Computed properties for template
  get trendingCategoryCount(): number {
    return this.categories.filter((c) => c.trending).length;
  }

  get onlineMemberCount(): number {
    return this.activeMembers.filter((m) => m.isOnline).length;
  }
  private destroy$ = new Subject<void>();

  // Outputs to parent
  @Output() categoryClicked = new EventEmitter<number>();
  @Output() postClicked = new EventEmitter<number>();
  @Output() createPost = new EventEmitter<void>();

  // Forum statistics
  totalPosts = 1250;
  totalMembers = 340;
  todayPosts = 25;
  onlineMembers = 42;

  // Featured categories
  categories = [
    {
      id: 1,
      name: 'Thảo luận chung',
      description: 'Nơi chia sẻ ý kiến và thảo luận về các chủ đề tổng quát',
      icon: '💬',
      color: 'from-blue-500 to-indigo-600',
      posts: 145,
      lastActivity: '5 phút trước',
      trending: true,
    },
    {
      id: 2,
      name: 'Hỏi đáp lập trình',
      description: 'Đặt câu hỏi và nhận trợ giúp về các vấn đề lập trình',
      icon: '❓',
      color: 'from-green-500 to-emerald-600',
      posts: 320,
      lastActivity: '2 phút trước',
      trending: true,
    },
    {
      id: 3,
      name: 'Chia sẻ dự án',
      description: 'Khoe dự án và nhận phản hồi từ cộng đồng',
      icon: '🚀',
      color: 'from-purple-500 to-pink-600',
      posts: 89,
      lastActivity: '10 phút trước',
      trending: false,
    },
    {
      id: 4,
      name: 'Tìm việc làm',
      description: 'Cơ hội việc làm và thông tin tuyển dụng',
      icon: '💼',
      color: 'from-orange-500 to-red-600',
      posts: 67,
      lastActivity: '1 giờ trước',
      trending: false,
    },
    {
      id: 5,
      name: 'Học tập & Tài liệu',
      description: 'Chia sẻ tài liệu học tập và kinh nghiệm học',
      icon: '📚',
      color: 'from-cyan-500 to-blue-600',
      posts: 201,
      lastActivity: '30 phút trước',
      trending: true,
    },
    {
      id: 6,
      name: 'Công nghệ mới',
      description: 'Thảo luận về xu hướng và công nghệ mới nhất',
      icon: '⚡',
      color: 'from-yellow-500 to-orange-600',
      posts: 156,
      lastActivity: '15 phút trước',
      trending: true,
    },
  ];

  // Recent posts
  recentPosts = [
    {
      id: 1,
      title: 'Làm thế nào để tối ưu hóa React app?',
      author: 'Nguyễn Văn A',
      avatar: '/assets/avatars/user1.png',
      category: 'Hỏi đáp lập trình',
      replies: 12,
      views: 156,
      lastReply: '5 phút trước',
      pinned: false,
      solved: true,
    },
    {
      id: 2,
      title: '[Thông báo] Quy tắc mới cho diễn đàn',
      author: 'Admin',
      avatar: '/assets/avatars/admin.png',
      category: 'Thảo luận chung',
      replies: 45,
      views: 892,
      lastReply: '1 giờ trước',
      pinned: true,
      solved: false,
    },
    {
      id: 3,
      title: 'Chia sẻ project e-commerce với Angular',
      author: 'Trần Thị B',
      avatar: '/assets/avatars/user2.png',
      category: 'Chia sẻ dự án',
      replies: 8,
      views: 234,
      lastReply: '2 giờ trước',
      pinned: false,
      solved: false,
    },
  ];

  // Active members
  activeMembers = [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      avatar: '/assets/avatars/user1.png',
      reputation: 1250,
      isOnline: true,
    },
    {
      id: 2,
      name: 'Trần Thị B',
      avatar: '/assets/avatars/user2.png',
      reputation: 980,
      isOnline: true,
    },
    {
      id: 3,
      name: 'Lê Hoàng C',
      avatar: '/assets/avatars/user3.png',
      reputation: 875,
      isOnline: false,
    },
    {
      id: 4,
      name: 'Phạm Minh D',
      avatar: '/assets/avatars/user4.png',
      reputation: 654,
      isOnline: true,
    },
  ];

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes if needed
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        // Handle theme changes if needed
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getTimeAgo(timestamp: string): string {
    // Simple time ago implementation
    return timestamp;
  }

  onCategoryClick(categoryId: number): void {
    this.categoryClicked.emit(categoryId);
  }

  onPostClick(postId: number): void {
    this.postClicked.emit(postId);
  }

  onCreatePost(): void {
    this.createPost.emit();
  }
}
