import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Models
import { User } from '../../core/models/user.model';

// Services and Data
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
// Components
import { ForumLayoutComponent } from './components/forum-layout/forum-layout.component';
import { PostCreatorComponent } from './components/post-creator/post-creator.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';

interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: number;
  tags: number[];
  isQuestion: boolean;
  attachments?: File[];
}

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ForumLayoutComponent,
    PostCreatorComponent,
    PostDetailComponent,
    NotificationToastComponent,
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.css',
})
export class ForumComponent implements OnInit, OnDestroy {
  // Current state
  currentUser: User | null = null;

  // UI State
  isMobileView = false;
  
  // Forum UI State
  viewMode: 'list' | 'post' = 'list';
  selectedPostId: number | null = null;
  showPostCreator = false;

  private destroy$ = new Subject<void>();

  constructor(
    public themeService: ThemeService,
    public router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Get current user from auth service
    this.currentUser = this.authService.getCurrentUser();
    
    // Subscribe to authentication state changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.onResize.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize.bind(this));
    }
  }

  // Forum-specific methods
  openPostCreator(): void {
    this.showPostCreator = true;
  }

  closePostCreator(): void {
    this.showPostCreator = false;
  }

  onPostCreated(postRequest: CreatePostRequest): void {
    console.log('New post created:', postRequest);
    // Here you would normally send the post to your backend service
    // this.forumService.createPost(postRequest).subscribe(...);
    
    // For demo purposes, just log and close modal
    this.closePostCreator();
  }

  viewPost(postId: number): void {
    this.selectedPostId = postId;
    this.viewMode = 'post';
  }

  backToForum(): void {
    this.viewMode = 'list';
    this.selectedPostId = null;
  }

  navigateToCategory(categoryId: number): void {
    console.log('Navigate to category:', categoryId);
    // Implement category filtering
  }

  // Essential utility methods
  private onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth < 768;
    }
  }
}
