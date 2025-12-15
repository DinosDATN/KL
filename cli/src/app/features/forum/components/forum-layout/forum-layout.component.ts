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
import { ForumService, ForumCategory, ForumPost, ForumStatistics } from '../../../../core/services/forum.service';
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

  // Data from service
  categories: ForumCategory[] = [];
  recentPosts: ForumPost[] = [];
  statistics: ForumStatistics | null = null;

  // Forum statistics (fallback values)
  get totalPosts(): number {
    return this.statistics?.totalPosts || 0;
  }
  
  get totalMembers(): number {
    return this.statistics?.totalMembers || 0;
  }
  
  get todayPosts(): number {
    return this.statistics?.todayPosts || 0;
  }
  
  get onlineMembers(): number {
    return this.statistics?.onlineMembers || 0;
  }



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

  constructor(
    public themeService: ThemeService,
    private forumService: ForumService
  ) {}

  ngOnInit(): void {
    // Subscribe to forum data
    this.forumService.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });

    this.forumService.statistics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(statistics => {
        this.statistics = statistics;
      });

    // Load recent posts
    this.loadRecentPosts();

    // Subscribe to theme changes if needed
    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        // Handle theme changes if needed
      });
  }

  private loadRecentPosts(): void {
    this.forumService.getPosts({ limit: 5, sortBy: 'created_at', sortOrder: 'DESC' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.recentPosts = result.data;
        },
        error: (error) => {
          console.error('Error loading recent posts:', error);
        }
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

  getAuthorName(author: any): string {
    return typeof author === 'string' ? author : author?.name || '';
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
