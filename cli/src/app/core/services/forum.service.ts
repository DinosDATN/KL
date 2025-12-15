import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  posts: number;
  lastActivity: string;
  trending: boolean;
}

export interface ForumPost {
  id: number;
  title: string;
  content?: string;
  author: { id: number; name: string; avatar: string };
  category: { id: number; name: string; icon?: string; color?: string };
  replies: number;
  views: number;
  votes: { up: number; down: number; userVote?: 'up' | 'down' };
  lastReply: string;
  lastReplyAuthor?: string;
  pinned: boolean;
  solved: boolean;
  isQuestion?: boolean;
  isPinned?: boolean; // Alias for pinned
  isSolved?: boolean; // Alias for solved
  isLocked?: boolean;
  acceptedAnswerId?: number;
  tags?: { id: number; name: string; color: string }[];
  attachments?: { id: number; name: string; url: string; type: string; size: number }[];
  createdAt: string;
  updatedAt?: string;
}

export interface ForumReply {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  votes: number;
  isSolution: boolean;
  parentReply?: {
    id: number;
    content: string;
    authorName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ForumStatistics {
  totalPosts: number;
  totalMembers: number;
  todayPosts: number;
  onlineMembers: number;
}

export interface CreatePostRequest {
  categoryId: number;
  title: string;
  content: string;
  isQuestion?: boolean;
  tags?: string[];
}

export interface CreateReplyRequest {
  content: string;
  parentReplyId?: number;
}

export interface VoteRequest {
  type: 'post' | 'reply';
  targetId: number;
  voteType: 'up' | 'down';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly apiUrl = `${environment.apiUrl}/forum`;
  
  // Cache for categories and statistics
  private categoriesSubject = new BehaviorSubject<ForumCategory[]>([]);
  private statisticsSubject = new BehaviorSubject<ForumStatistics | null>(null);
  
  public categories$ = this.categoriesSubject.asObservable();
  public statistics$ = this.statisticsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load initial data
    this.loadCategories();
    this.loadStatistics();
  }

  // Categories
  getCategories(): Observable<ForumCategory[]> {
    return this.http.get<{ success: boolean; data: ForumCategory[] }>(`${this.apiUrl}/categories`)
      .pipe(
        map(response => response.data),
        tap(categories => this.categoriesSubject.next(categories))
      );
  }

  private loadCategories(): void {
    this.getCategories().subscribe({
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  // Posts
  getPosts(options: {
    categoryId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
    tags?: string[];
  } = {}): Observable<PaginationResult<ForumPost>> {
    let params = new HttpParams();
    
    if (options.categoryId) params = params.set('categoryId', options.categoryId.toString());
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.sortBy) params = params.set('sortBy', options.sortBy);
    if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);
    if (options.search) params = params.set('search', options.search);
    if (options.tags && options.tags.length > 0) {
      params = params.set('tags', options.tags.join(','));
    }

    return this.http.get<{ success: boolean; data: PaginationResult<ForumPost> }>(`${this.apiUrl}/posts`, { params })
      .pipe(map(response => response.data));
  }

  getPost(id: number): Observable<ForumPost> {
    return this.http.get<{ success: boolean; data: ForumPost }>(`${this.apiUrl}/posts/${id}`)
      .pipe(map(response => response.data));
  }

  createPost(postData: CreatePostRequest): Observable<{ id: number }> {
    return this.http.post<{ success: boolean; data: { id: number } }>(`${this.apiUrl}/posts`, postData)
      .pipe(
        map(response => response.data),
        tap(() => {
          // Refresh statistics after creating a post
          this.loadStatistics();
        })
      );
  }

  // Replies
  getReplies(postId: number, page: number = 1, limit: number = 20): Observable<PaginationResult<ForumReply>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ success: boolean; data: PaginationResult<ForumReply> }>(`${this.apiUrl}/posts/${postId}/replies`, { params })
      .pipe(map(response => response.data));
  }

  createReply(postId: number, replyData: CreateReplyRequest): Observable<{ id: number }> {
    return this.http.post<{ success: boolean; data: { id: number } }>(`${this.apiUrl}/posts/${postId}/replies`, replyData)
      .pipe(map(response => response.data));
  }

  // Voting
  vote(voteData: VoteRequest): Observable<{ success: boolean; voteChange: number }> {
    return this.http.post<{ success: boolean; data: { success: boolean; voteChange: number } }>(`${this.apiUrl}/vote`, voteData)
      .pipe(map(response => response.data));
  }

  // Statistics
  getStatistics(): Observable<ForumStatistics> {
    return this.http.get<{ success: boolean; data: ForumStatistics }>(`${this.apiUrl}/statistics`)
      .pipe(
        map(response => response.data),
        tap(statistics => this.statisticsSubject.next(statistics))
      );
  }

  private loadStatistics(): void {
    this.getStatistics().subscribe({
      error: (error) => console.error('Error loading statistics:', error)
    });
  }

  // Tags
  getTrendingTags(limit: number = 20): Observable<any[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/tags/trending`, { params })
      .pipe(map(response => response.data));
  }

  // Search
  searchPosts(searchTerm: string, page: number = 1, limit: number = 20): Observable<ForumPost[]> {
    const params = new HttpParams()
      .set('q', searchTerm)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ success: boolean; data: ForumPost[] }>(`${this.apiUrl}/search`, { params })
      .pipe(map(response => response.data));
  }

  // Utility methods
  refreshData(): void {
    this.loadCategories();
    this.loadStatistics();
  }

  // Get cached data
  getCachedCategories(): ForumCategory[] {
    return this.categoriesSubject.value;
  }

  getCachedStatistics(): ForumStatistics | null {
    return this.statisticsSubject.value;
  }
}