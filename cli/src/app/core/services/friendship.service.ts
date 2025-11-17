import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, tap, catchError, switchMap, takeUntil } from 'rxjs/operators';
import { 
  Friendship, 
  FriendshipStatus, 
  FriendRequest, 
  UserBlock,
  FriendSearchResult 
} from '../models/friendship.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SocketService } from './socket.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FriendshipService implements OnDestroy {
  private apiUrl = environment.production ? environment.apiUrl : 'http://localhost:3000/api/v1';
  private destroy$ = new Subject<void>();
  
  // State management
  private friendsSubject = new BehaviorSubject<FriendRequest[]>([]);
  private pendingRequestsSubject = new BehaviorSubject<Friendship[]>([]);
  private sentRequestsSubject = new BehaviorSubject<Friendship[]>([]);
  private blockedUsersSubject = new BehaviorSubject<UserBlock[]>([]);
  private unreadFriendRequestsCountSubject = new BehaviorSubject<number>(0);
  
  // Public observables
  public friends$ = this.friendsSubject.asObservable();
  public pendingRequests$ = this.pendingRequestsSubject.asObservable();
  public sentRequests$ = this.sentRequestsSubject.asObservable();
  public blockedUsers$ = this.blockedUsersSubject.asObservable();
  public unreadFriendRequestsCount$ = this.unreadFriendRequestsCountSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private socketService: SocketService
  ) {
    this.loadInitialData();
    this.initializeSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialize socket listeners for real-time friend request notifications
  private initializeSocketListeners(): void {
    console.log('🔧 FriendshipService: Initializing socket listeners');
    
    // Listen for new friend request received
    this.socketService.friendRequestReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('📬 FriendshipService: Friend request received via socket', data);
        console.log('📊 Current pending requests count:', this.pendingRequestsSubject.value.length);
        
        // Add to pending requests
        const pendingRequests = this.pendingRequestsSubject.value;
        const exists = pendingRequests.some(req => req.id === data.friendship.id);
        if (!exists) {
          this.pendingRequestsSubject.next([...pendingRequests, data.friendship]);
          console.log('✅ Added to pending requests');
        } else {
          console.log('⚠️ Friend request already exists in pending list');
        }
        
        // Update unread count
        const currentCount = this.unreadFriendRequestsCountSubject.value;
        this.unreadFriendRequestsCountSubject.next(currentCount + 1);
        console.log('📊 Updated unread count:', currentCount + 1);
        
        // Show notification ONLY ONCE
        console.log('🔔 Showing notification for friend request received');
        this.notificationService.info(
          'Lời mời kết bạn mới',
          `${data.requester?.name || 'Ai đó'} đã gửi lời mời kết bạn cho bạn`,
          5000
        );
      });

    // Listen for friend request accepted
    this.socketService.friendRequestAccepted$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('✅ FriendshipService: Friend request accepted via socket', data);
        console.log('📊 Current sent requests count:', this.sentRequestsSubject.value.length);
        
        // Remove from sent requests
        const sentRequests = this.sentRequestsSubject.value;
        const updatedSent = sentRequests.filter(req => req.id !== data.friendship.id);
        this.sentRequestsSubject.next(updatedSent);
        console.log('✅ Removed from sent requests, new count:', updatedSent.length);
        
        // Reload friends list
        this.loadFriends().subscribe();
        console.log('🔄 Reloading friends list');
        
        // Show notification ONLY ONCE
        console.log('🔔 Showing notification for friend request accepted');
        this.notificationService.success(
          'Chấp nhận kết bạn',
          `${data.addressee?.name || 'Người dùng'} đã chấp nhận lời mời kết bạn của bạn`,
          5000
        );
      });

    // Listen for friend request declined
    this.socketService.friendRequestDeclined$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('❌ FriendshipService: Friend request declined via socket', data);
        console.log('📊 Current sent requests count:', this.sentRequestsSubject.value.length);
        
        // Remove from sent requests
        const sentRequests = this.sentRequestsSubject.value;
        const updatedSent = sentRequests.filter(req => req.id !== data.friendship.id);
        this.sentRequestsSubject.next(updatedSent);
        console.log('✅ Removed from sent requests, new count:', updatedSent.length);
        
        // Show notification ONLY ONCE
        console.log('🔔 Showing notification for friend request declined');
        this.notificationService.info(
          'Từ chối kết bạn',
          `${data.addressee?.name || 'Người dùng'} đã từ chối lời mời kết bạn của bạn`,
          5000
        );
      });
  }
  
  // Initialize friendship data
  private loadInitialData(): void {
    if (this.authService.isAuthenticated()) {
      this.loadFriends().subscribe();
      this.loadPendingRequests().subscribe();
      this.loadSentRequests().subscribe();
    }
  }
  
  // Friend request methods
  sendFriendRequest(addresseeId: number): Observable<Friendship> {
    return this.http.post<{success: boolean, data: Friendship}>(
      `${this.apiUrl}/friendship/requests`,
      { addressee_id: addresseeId }
    ).pipe(
      map(response => response.data),
      tap(friendship => {
        // Add to sent requests
        const sentRequests = this.sentRequestsSubject.value;
        this.sentRequestsSubject.next([...sentRequests, friendship]);
        
        this.notificationService.success(
          'Gửi lời mời kết bạn',
          `Đã gửi lời mời kết bạn tới ${friendship.Addressee?.name || 'người dùng'}`
        );
      }),
      catchError(error => {
        this.notificationService.error(
          'Lỗi gửi lời mời',
          error.error?.message || 'Không thể gửi lời mời kết bạn'
        );
        throw error;
      })
    );
  }
  
  respondToFriendRequest(friendshipId: number, action: 'accept' | 'decline'): Observable<Friendship> {
    return this.http.put<{success: boolean, data: Friendship}>(
      `${this.apiUrl}/friendship/requests/${friendshipId}/respond`,
      { action }
    ).pipe(
      map(response => response.data),
      tap(friendship => {
        // Remove from pending requests
        const pendingRequests = this.pendingRequestsSubject.value;
        const updatedPending = pendingRequests.filter(req => req.id !== friendshipId);
        this.pendingRequestsSubject.next(updatedPending);
        
        // Update unread count
        this.unreadFriendRequestsCountSubject.next(Math.max(0, this.unreadFriendRequestsCountSubject.value - 1));
        
        if (action === 'accept') {
          // Add to friends list
          this.loadFriends().subscribe();
          
          // Show notification for the person who accepted (current user)
          // Note: The requester will receive notification via socket
          this.notificationService.success(
            'Chấp nhận kết bạn',
            `Bạn đã trở thành bạn bè với ${friendship.Requester?.name || 'người dùng'}`
          );
        } else {
          // Show notification for the person who declined (current user)
          // Note: The requester will receive notification via socket
          this.notificationService.info(
            'Từ chối kết bạn',
            `Đã từ chối lời mời kết bạn từ ${friendship.Requester?.name || 'người dùng'}`
          );
        }
      }),
      catchError(error => {
        this.notificationService.error(
          'Lỗi phản hồi',
          error.error?.message || 'Không thể phản hồi lời mời kết bạn'
        );
        throw error;
      })
    );
  }
  
  // Friends management
  loadFriends(page: number = 1, limit: number = 50, search: string = ''): Observable<FriendRequest[]> {
    let url = `${this.apiUrl}/friendship/friends?page=${page}&limit=${limit}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    return this.http.get<{success: boolean, data: {friends: FriendRequest[], totalCount: number}}>(
      url
    ).pipe(
      map(response => response.data.friends),
      tap(friends => {
        if (page === 1) {
          this.friendsSubject.next(friends);
        } else {
          // For pagination, append to existing friends
          const currentFriends = this.friendsSubject.value;
          this.friendsSubject.next([...currentFriends, ...friends]);
        }
      })
    );
  }
  
  loadPendingRequests(page: number = 1, limit: number = 20): Observable<Friendship[]> {
    return this.http.get<{success: boolean, data: {requests: Friendship[], totalCount: number}}>(
      `${this.apiUrl}/friendship/requests/pending?page=${page}&limit=${limit}`
    ).pipe(
      map(response => response.data.requests),
      tap(requests => {
        this.pendingRequestsSubject.next(requests);
        this.unreadFriendRequestsCountSubject.next(requests.length);
      })
    );
  }
  
  loadSentRequests(page: number = 1, limit: number = 20): Observable<Friendship[]> {
    return this.http.get<{success: boolean, data: {requests: Friendship[], totalCount: number}}>(
      `${this.apiUrl}/friendship/requests/sent?page=${page}&limit=${limit}`
    ).pipe(
      map(response => response.data.requests),
      tap(requests => {
        this.sentRequestsSubject.next(requests);
      })
    );
  }
  
  removeFriend(friendId: number): Observable<void> {
    return this.http.delete<{success: boolean}>(
      `${this.apiUrl}/friendship/friends/${friendId}`
    ).pipe(
      map(() => void 0),
      tap(() => {
        // Remove from friends list
        const friends = this.friendsSubject.value;
        const updatedFriends = friends.filter(friend => friend.friend.id !== friendId);
        this.friendsSubject.next(updatedFriends);
        
        this.notificationService.info(
          'Hủy kết bạn',
          'Đã hủy kết bạn thành công'
        );
      }),
      catchError(error => {
        this.notificationService.error(
          'Lỗi hủy kết bạn',
          error.error?.message || 'Không thể hủy kết bạn'
        );
        throw error;
      })
    );
  }
  
  // Friendship status
  getFriendshipStatus(userId: number): Observable<FriendshipStatus> {
    return this.http.get<{success: boolean, data: FriendshipStatus}>(
      `${this.apiUrl}/friendship/status/${userId}`
    ).pipe(
      map(response => response.data)
    );
  }
  
  // Blocking functionality
  blockUser(userId: number, reason?: string): Observable<UserBlock> {
    return this.http.post<{success: boolean, data: UserBlock}>(
      `${this.apiUrl}/friendship/block/${userId}`,
      { reason: reason || null }
    ).pipe(
      map(response => response.data),
      tap(block => {
        // Add to blocked users list
        const blockedUsers = this.blockedUsersSubject.value;
        this.blockedUsersSubject.next([...blockedUsers, block]);
        
        // Remove from friends if exists
        const friends = this.friendsSubject.value;
        const updatedFriends = friends.filter(friend => friend.friend.id !== userId);
        this.friendsSubject.next(updatedFriends);
        
        this.notificationService.success(
          'Chặn người dùng',
          `Đã chặn người dùng thành công`
        );
      }),
      catchError(error => {
        this.notificationService.error(
          'Lỗi chặn người dùng',
          error.error?.message || 'Không thể chặn người dùng'
        );
        throw error;
      })
    );
  }
  
  unblockUser(userId: number): Observable<void> {
    return this.http.delete<{success: boolean}>(
      `${this.apiUrl}/friendship/block/${userId}`
    ).pipe(
      map(() => void 0),
      tap(() => {
        // Remove from blocked users list
        const blockedUsers = this.blockedUsersSubject.value;
        const updatedBlocked = blockedUsers.filter(block => 
          block.blocked_id !== userId && block.BlockedUser?.id !== userId
        );
        this.blockedUsersSubject.next(updatedBlocked);
        
        this.notificationService.success(
          'Bỏ chặn người dùng',
          'Đã bỏ chặn người dùng thành công'
        );
      }),
      catchError(error => {
        this.notificationService.error(
          'Lỗi bỏ chặn',
          error.error?.message || 'Không thể bỏ chặn người dùng'
        );
        throw error;
      })
    );
  }
  
  loadBlockedUsers(page: number = 1, limit: number = 20): Observable<UserBlock[]> {
    return this.http.get<{success: boolean, data: {blockedUsers: UserBlock[], totalCount: number}}>(
      `${this.apiUrl}/friendship/blocked?page=${page}&limit=${limit}`
    ).pipe(
      map(response => response.data.blockedUsers),
      tap(blockedUsers => {
        this.blockedUsersSubject.next(blockedUsers);
      })
    );
  }
  
  // Search functionality
  searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return new Observable(observer => observer.next([]));
    }
    
    return this.http.get<{success: boolean, data: User[]}>(
      `${this.apiUrl}/chat/users/search?q=${encodeURIComponent(searchTerm)}`
    ).pipe(
      map(response => response.data)
    );
  }
  
  // Search users with friendship status
  searchUsersWithStatus(searchTerm: string): Observable<FriendSearchResult[]> {
    return this.searchUsers(searchTerm).pipe(
      switchMap(users => {
        if (users.length === 0) {
          return new Observable<FriendSearchResult[]>(observer => observer.next([]));
        }
        
        // Get friendship status for each user
        const statusRequests = users.map(user => 
          this.getFriendshipStatus(user.id).pipe(
            map(status => ({ ...user, friendship_status: status } as FriendSearchResult))
          )
        );
        
        return combineLatest(statusRequests);
      })
    );
  }
  
  // Utility methods
  getFriends(): FriendRequest[] {
    return this.friendsSubject.value;
  }
  
  getPendingRequests(): Friendship[] {
    return this.pendingRequestsSubject.value;
  }
  
  getSentRequests(): Friendship[] {
    return this.sentRequestsSubject.value;
  }
  
  getBlockedUsers(): UserBlock[] {
    return this.blockedUsersSubject.value;
  }
  
  getUnreadFriendRequestsCount(): number {
    return this.unreadFriendRequestsCountSubject.value;
  }
  
  // Check if user is friend
  isFriend(userId: number): boolean {
    return this.friendsSubject.value.some(friend => friend.friend.id === userId);
  }
  
  // Check if user is blocked
  isBlocked(userId: number): boolean {
    return this.blockedUsersSubject.value.some(block => 
      block.blocked_id === userId || block.BlockedUser?.id === userId
    );
  }
  
  // Refresh all data
  refreshAllData(): void {
    this.loadFriends().subscribe();
    this.loadPendingRequests().subscribe();
    this.loadSentRequests().subscribe();
    this.loadBlockedUsers().subscribe();
  }
  
  // Clear data (for logout)
  clearData(): void {
    this.friendsSubject.next([]);
    this.pendingRequestsSubject.next([]);
    this.sentRequestsSubject.next([]);
    this.blockedUsersSubject.next([]);
    this.unreadFriendRequestsCountSubject.next(0);
  }
}
