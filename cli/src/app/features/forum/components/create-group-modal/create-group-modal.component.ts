import { Component, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { ChatService } from '../../../../core/services/chat.service';
import { SocketService } from '../../../../core/services/socket.service';
import { User } from '../../../../core/models/user.model';
import { ChatRoom } from '../../../../core/models/chat.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group-modal.component.html',
  styleUrl: './create-group-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateGroupModalComponent implements OnInit, OnDestroy {
  @Input() currentUser!: User;

  @Output() groupCreated = new EventEmitter<ChatRoom>();
  @Output() modalClosed = new EventEmitter<void>();

  // Form fields
  groupName = '';
  groupDescription = '';
  isPublic = true;
  selectedUsers: User[] = [];
  userSearchTerm = '';
  isCreating = false;
  
  // Search and user management
  private destroy$ = new Subject<void>();
  private searchTermSubject = new Subject<string>();
  searchResults: User[] = [];
  onlineUsers: User[] = [];
  isSearching = false;
  showSearchResults = false;
  errorMessage = '';
  successMessage = '';
  showOnlineUsers = true;

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get current user if not provided
    if (!this.currentUser) {
      this.currentUser = this.authService.getCurrentUser() || {} as User;
    }

    // Initialize search
    this.searchTermSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) {
          this.isSearching = false;
          this.showSearchResults = false;
          this.showOnlineUsers = true;
          this.searchResults = [];
          this.cdr.detectChanges();
          return of([]);
        }
        
        this.isSearching = true;
        this.showSearchResults = true;
        this.showOnlineUsers = false;
        this.cdr.detectChanges();
        
        return this.chatService.searchUsers(term).pipe(
          catchError(error => {
            console.error('Search error:', error);
            this.isSearching = false;
            this.showSearchResults = false;
            this.showOnlineUsers = true;
            this.errorMessage = 'Error searching users';
            this.searchResults = [];
            this.cdr.detectChanges();
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.searchResults = results.filter(user => 
        user.id !== this.currentUser.id && 
        !this.isUserSelected(user)
      );
      this.isSearching = false;
      this.cdr.detectChanges();
    });

    // Load online users
    this.loadOnlineUsers();

    // Listen for socket errors
    this.socketService.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        this.errorMessage = error.message;
        this.isCreating = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOnlineUsers(): void {
    this.chatService.getOnlineUsers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: users => {
        this.onlineUsers = users.filter(user => 
          user.id !== this.currentUser.id
        );
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error loading online users:', error);
      }
    });
  }

  onSearchTermChange(): void {
    this.searchTermSubject.next(this.userSearchTerm);
  }

  close(): void {
    this.modalClosed.emit();
  }

  createGroup(): void {
    if (!this.groupName.trim() || this.isCreating) return;

    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';

    const roomData = {
      name: this.groupName.trim(),
      description: this.groupDescription.trim(),
      type: 'group',
      is_public: this.isPublic,
      memberIds: this.selectedUsers.map(user => user.id)
    };

    this.chatService.createRoomWithValidation(roomData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: result => {
        this.successMessage = `Group "${result.room.name}" created successfully!`;
        
        // Show validation results if any invalid members
        if (result.invalidMembers.length > 0) {
          this.errorMessage = `Note: ${result.invalidMembers.length} user(s) could not be added to the group.`;
        }

        // Emit the created room
        this.groupCreated.emit(result.room);
        
        // Close modal after a short delay
        setTimeout(() => {
          this.resetForm();
          this.close();
        }, 1500);
        
        this.isCreating = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error('Error creating group:', error);
        this.errorMessage = error.message || 'Failed to create group. Please try again.';
        this.isCreating = false;
        this.cdr.detectChanges();
      }
    });
  }

  private resetForm(): void {
    this.groupName = '';
    this.groupDescription = '';
    this.isPublic = true;
    this.selectedUsers = [];
    this.userSearchTerm = '';
    this.searchResults = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.showSearchResults = false;
    this.showOnlineUsers = true;
  }

  toggleUser(user: User): void {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
    
    // Update search results to exclude newly selected users
    if (this.showSearchResults) {
      this.searchResults = this.searchResults.filter(u => u.id !== user.id);
    }
    
    this.cdr.detectChanges();
  }

  removeUser(user: User): void {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  isUserSelected(user: User): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  getFilteredUsers(): User[] {
    const users = this.showSearchResults ? this.searchResults : this.onlineUsers;
    return users.filter(user => 
      user.id !== this.currentUser.id && 
      !this.isUserSelected(user)
    ).sort((a, b) => {
      // Sort by online status first, then by name
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.name.localeCompare(b.name);
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

  clearSearch(): void {
    this.userSearchTerm = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.showOnlineUsers = true;
    this.cdr.detectChanges();
  }

  // Helper methods for template
  getCreateButtonText(): string {
    if (this.isCreating) return 'Creating...';
    return 'Create Group';
  }

  isCreateDisabled(): boolean {
    return !this.groupName.trim() || this.isCreating;
  }

  getSelectedUsersText(): string {
    const count = this.selectedUsers.length;
    if (count === 0) return 'No members selected';
    if (count === 1) return '1 member selected';
    return `${count} members selected`;
  }
}
