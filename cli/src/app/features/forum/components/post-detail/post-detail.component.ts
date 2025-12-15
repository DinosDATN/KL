import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeService } from '../../../../core/services/theme.service';
import { ForumService, ForumPost, ForumReply } from '../../../../core/services/forum.service';
import { Subject, takeUntil } from 'rxjs';

interface PostAuthor {
  id: number;
  name: string;
  avatar?: string;
  reputation: number;
  badge?: string;
  isOnline: boolean;
  joinedAt: string;
}

interface PostTag {
  id: number;
  name: string;
  color: string;
}

interface Comment {
  id: number;
  content: string;
  author: PostAuthor;
  createdAt: string;
  updatedAt?: string;
  votes: { up: number; down: number; userVote?: 'up' | 'down' };
  isAccepted?: boolean;
  replies?: Comment[];
  showReplies?: boolean;
}

interface ForumPostDetail {
  id: number;
  title: string;
  content: string;
  author: PostAuthor;
  category: { id: number; name: string; icon: string };
  tags: PostTag[];
  createdAt: string;
  updatedAt?: string;
  views: number;
  votes: { up: number; down: number; userVote?: 'up' | 'down' };
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  isQuestion: boolean;
  acceptedAnswerId?: number;
  attachments?: { id: number; name: string; url: string; type: string; size: number }[];
}

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.css'
})
export class PostDetailComponent implements OnInit, OnDestroy {
  @Input() postId!: number;
  
  private destroy$ = new Subject<void>();
  
  // Form for new comments
  commentForm: FormGroup;
  isSubmittingComment = false;
  replyingTo: number | null = null;

  // Post data
  post: ForumPost | null = null;
  replies: ForumReply[] = [];
  isLoading = true;
  
  // Mock post data for fallback
  mockPost: ForumPost = {
    id: 1,
    title: 'Làm thế nào để tối ưu hóa hiệu suất React application?',
    content: `Chào mọi người!

Tôi đang phát triển một ứng dụng React khá lớn và gặp một số vấn đề về hiệu suất. Ứng dụng có khoảng 50+ components và sử dụng Redux để quản lý state.

## Vấn đề hiện tại:
- Render chậm khi có nhiều components
- Bundle size khá lớn (~2MB)
- First load time khá lâu

## Những gì tôi đã thử:
1. **Code splitting** với \`React.lazy()\`
2. **Memo hóa** các components với \`React.memo()\`  
3. **Lazy loading** cho images

\`\`\`javascript
// Ví dụ code hiện tại
const MyComponent = React.memo(({ data }) => {
  const expensiveValue = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);
  
  return <div>{expensiveValue}</div>;
});
\`\`\`

Có ai có kinh nghiệm với các kỹ thuật tối ưu khác không? Đặc biệt là về **bundle optimization** và **rendering performance**.

Cảm ơn mọi người!`,
    author: {
      id: 1,
      name: 'Nguyễn Văn A',
      avatar: ''
    },
    category: { id: 2, name: 'Hỏi đáp lập trình', icon: '❓' },
    tags: [
      { id: 3, name: 'React', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
      { id: 1, name: 'JavaScript', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      { id: 12, name: 'Performance', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    ],
    createdAt: '2024-01-15T10:30:00Z',
    views: 256,
    votes: { up: 15, down: 2, userVote: undefined },
    replies: 3,
    lastReply: '2 giờ trước',
    pinned: false,
    solved: true,
    isQuestion: true,
    isPinned: false,
    isLocked: false,
    isSolved: true,
    acceptedAnswerId: 2,
    attachments: [
      { id: 1, name: 'performance-report.png', url: '#', type: 'image/png', size: 1024000 }
    ]
  };

  // Comments data
  comments: Comment[] = [
    {
      id: 1,
      content: 'Bạn có thể thử sử dụng **Webpack Bundle Analyzer** để phân tích bundle size. Ngoài ra, hãy xem xét sử dụng **Tree shaking** để loại bỏ code không sử dụng.',
      author: {
        id: 2,
        name: 'Trần Thị B',
        reputation: 890,
        badge: 'Contributor',
        isOnline: false,
        joinedAt: '2023-03-20'
      },
      createdAt: '2024-01-15T11:00:00Z',
      votes: { up: 8, down: 0, userVote: undefined },
      replies: [
        {
          id: 3,
          content: 'Đồng ý! Bundle Analyzer rất hữu ích. Tôi cũng recommend thêm **React DevTools Profiler** để debug performance issues.',
          author: {
            id: 3,
            name: 'Lê Hoàng C',
            reputation: 650,
            isOnline: true,
            joinedAt: '2023-06-10'
          },
          createdAt: '2024-01-15T11:30:00Z',
          votes: { up: 3, down: 0, userVote: undefined }
        }
      ],
      showReplies: true
    },
    {
      id: 2,
      content: `Rất hay! Đây là một số tips tôi thường dùng:

## 1. Code Splitting nâng cao:
\`\`\`javascript
// Route-based splitting
const LazyComponent = lazy(() => import('./LazyComponent'));

// Component-based splitting
const LazyModal = lazy(() => import('./Modal'));
\`\`\`

## 2. Virtualization cho danh sách dài:
Sử dụng \`react-window\` hoặc \`react-virtualized\` cho lists có nhiều items.

## 3. Service Worker để cache:
Implement caching strategy với Workbox.

## 4. Bundle optimization:
- Tree shaking
- Minification
- Gzip compression
- Split vendor chunks

Hy vọng giúp ích được!`,
      author: {
        id: 4,
        name: 'Phạm Minh D',
        reputation: 1580,
        badge: 'Expert',
        isOnline: true,
        joinedAt: '2022-11-05'
      },
      createdAt: '2024-01-15T12:15:00Z',
      votes: { up: 22, down: 1, userVote: undefined },
      isAccepted: true
    },
    {
      id: 4,
      content: 'Bạn cũng nên xem xét sử dụng **Preact** thay vì React để giảm bundle size, hoặc **SWC** thay vì Babel để tăng tốc độ build.',
      author: {
        id: 5,
        name: 'Võ Thị E',
        reputation: 420,
        isOnline: false,
        joinedAt: '2023-08-12'
      },
      createdAt: '2024-01-15T14:20:00Z',
      votes: { up: 5, down: 2, userVote: undefined }
    }
  ];

  // Sorting and filtering
  sortBy: 'newest' | 'oldest' | 'votes' = 'votes';
  showSolved = true;

  constructor(
    private formBuilder: FormBuilder,
    public themeService: ThemeService,
    private forumService: ForumService
  ) {
    this.commentForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Load post data based on postId
    // In real implementation, this would be an API call
    this.loadPostData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPostData(): void {
    if (!this.postId) return;
    
    this.isLoading = true;
    
    // Load post details
    this.forumService.getPost(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          this.post = post;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading post:', error);
          this.post = this.mockPost; // Fallback to mock data
          this.isLoading = false;
        }
      });

    // Load replies
    this.forumService.getReplies(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.replies = result.data;
        },
        error: (error) => {
          console.error('Error loading replies:', error);
          // Convert comments to replies format
          this.replies = this.comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            author: {
              id: comment.author.id,
              name: comment.author.name,
              avatar: comment.author.avatar || ''
            },
            votes: comment.votes.up - comment.votes.down,
            isSolution: comment.isAccepted || false,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt || comment.createdAt
          }));
        }
      });
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} tuần trước`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} tháng trước`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('text/')) return '📝';
    return '📎';
  }

  vote(type: 'up' | 'down', target: 'post' | 'comment', id?: number): void {
    if (target === 'post' && this.post) {
      const currentVote = this.post.votes?.userVote;
      if (currentVote === type) {
        // Remove vote
        this.post.votes.userVote = undefined;
        this.post.votes[type]--;
      } else {
        // Change or add vote
        if (currentVote) {
          this.post.votes[currentVote]--;
        }
        this.post.votes[type]++;
        this.post.votes.userVote = type;
      }
    } else if (target === 'comment' && id) {
      const comment = this.findCommentById(id);
      if (comment) {
        const currentVote = comment.votes.userVote;
        if (currentVote === type) {
          // Remove vote
          comment.votes.userVote = undefined;
          comment.votes[type]--;
        } else {
          // Change or add vote
          if (currentVote) {
            comment.votes[currentVote]--;
          }
          comment.votes[type]++;
          comment.votes.userVote = type;
        }
      }
    }
  }

  findCommentById(id: number): Comment | undefined {
    for (const comment of this.comments) {
      if (comment.id === id) return comment;
      if (comment.replies) {
        const found = comment.replies.find(reply => reply.id === id);
        if (found) return found;
      }
    }
    return undefined;
  }

  toggleReplies(commentId: number): void {
    const comment = this.findCommentById(commentId);
    if (comment) {
      comment.showReplies = !comment.showReplies;
    }
  }

  startReply(commentId: number): void {
    this.replyingTo = commentId;
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.commentForm.reset();
  }

  submitComment(): void {
    if (this.commentForm.valid && !this.isSubmittingComment && this.postId) {
      this.isSubmittingComment = true;
      
      const replyData = {
        content: this.commentForm.value.content,
        parentReplyId: this.replyingTo || undefined
      };

      this.forumService.createReply(this.postId, replyData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            console.log('Reply created successfully:', result);
            // Reload replies to get the new one
            this.loadReplies();
            this.commentForm.reset();
            this.replyingTo = null;
            this.isSubmittingComment = false;
          },
          error: (error) => {
            console.error('Error creating reply:', error);
            this.isSubmittingComment = false;
          }
        });
    }
  }

  private loadReplies(): void {
    if (!this.postId) return;
    
    this.forumService.getReplies(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.replies = result.data;
        },
        error: (error) => {
          console.error('Error loading replies:', error);
        }
      });
  }

  markAsAccepted(commentId: number): void {
    if (!this.post) return;
    // Only post author can mark answers as accepted
    this.comments.forEach(comment => {
      comment.isAccepted = comment.id === commentId;
    });
    this.post.acceptedAnswerId = commentId;
    this.post.solved = true;
    this.post.isSolved = true;
  }

  togglePin(): void {
    if (!this.post) return;
    // Only moderators can pin posts
    this.post.pinned = !this.post.pinned;
    this.post.isPinned = this.post.pinned;
  }

  toggleLock(): void {
    if (!this.post) return;
    // Only moderators can lock posts
    this.post.isLocked = !this.post.isLocked;
  }

  get sortedComments(): Comment[] {
    const sorted = [...this.comments];
    
    switch (this.sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'votes':
        return sorted.sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down));
      default:
        return sorted;
    }
  }

  formatContent(content: string): string {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto"><code>$2</code></pre>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-semibold mt-4 mb-2">$1</h1>')
      .replace(/\n/g, '<br>');
  }

  // Helper methods for template
  getTagName(tag: any): string {
    return typeof tag === 'string' ? tag : tag?.name || '';
  }

  getTagColor(tag: any): string {
    return typeof tag === 'string' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : (tag?.color || 'bg-gray-100 text-gray-800');
  }
}
