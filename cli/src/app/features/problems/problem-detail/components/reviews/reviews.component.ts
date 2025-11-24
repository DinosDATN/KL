import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProblemComment } from '../../../../../core/models/problem.model';
import { ProblemsService } from '../../../../../core/services/problems.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css'
})
export class ReviewsComponent implements OnInit {
  @Input() problemId!: number;
  
  comments: ProblemComment[] = [];
  loading = false;
  error: string | null = null;
  currentUser: User | null = null;
  
  // Comment form
  newComment: string = '';
  isSubmitting = false;
  editingCommentId: number | null = null;
  editingContent: string = '';

  constructor(
    private problemsService: ProblemsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadComments();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadComments(): void {
    this.loading = true;
    this.error = null;
    
    this.problemsService.getProblemComments(this.problemId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.error = 'Không thể tải bình luận';
        this.loading = false;
      }
    });
  }

  submitComment(): void {
    if (!this.newComment.trim() || this.isSubmitting) {
      return;
    }

    if (!this.currentUser) {
      this.error = 'Vui lòng đăng nhập để bình luận';
      return;
    }

    this.isSubmitting = true;
    this.problemsService.createProblemComment(this.problemId, this.newComment.trim()).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.newComment = '';
        this.isSubmitting = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        this.error = error.error?.message || 'Không thể tạo bình luận';
        this.isSubmitting = false;
      }
    });
  }

  startEdit(comment: ProblemComment): void {
    if (this.isOwnComment(comment)) {
      this.editingCommentId = comment.id;
      this.editingContent = comment.content;
    }
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editingContent = '';
  }

  updateComment(commentId: number): void {
    if (!this.editingContent.trim() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.problemsService.updateProblemComment(this.problemId, commentId, this.editingContent.trim()).subscribe({
      next: (updatedComment) => {
        const index = this.comments.findIndex(c => c.id === commentId);
        if (index !== -1) {
          this.comments[index] = updatedComment;
        }
        this.cancelEdit();
        this.isSubmitting = false;
        this.error = null;
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        this.error = error.error?.message || 'Không thể cập nhật bình luận';
        this.isSubmitting = false;
      }
    });
  }

  deleteComment(commentId: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    this.problemsService.deleteProblemComment(this.problemId, commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
        this.error = null;
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        this.error = error.error?.message || 'Không thể xóa bình luận';
      }
    });
  }

  isOwnComment(comment: ProblemComment): boolean {
    return this.currentUser?.id === comment.user_id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else if (minutes > 0) {
      return `${minutes} phút trước`;
    } else {
      return 'Vừa xong';
    }
  }

  getAvatarUrl(comment: ProblemComment): string {
    return comment.User?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.User?.name || 'User') + '&background=random';
  }

  getCurrentUserAvatarUrl(): string {
    if (!this.currentUser) {
      return 'https://ui-avatars.com/api/?name=User&background=random';
    }
    return this.currentUser.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.currentUser.name) + '&background=random';
  }
}
