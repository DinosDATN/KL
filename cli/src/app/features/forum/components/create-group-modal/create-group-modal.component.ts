import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { User } from '../../../../core/models/user.model';
@Component({
  selector: 'app-create-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group-modal.component.html',
  styleUrl: './create-group-modal.component.css',
})
export class CreateGroupModalComponent {
  @Input() users: User[] = [];
  @Input() currentUser!: User;

  @Output() groupCreated = new EventEmitter<{
    name: string;
    description: string;
    isPublic: boolean;
    selectedUsers: User[];
  }>();
  @Output() modalClosed = new EventEmitter<void>();

  groupName = '';
  groupDescription = '';
  isPublic = true;
  selectedUsers: User[] = [];
  userSearchTerm = '';
  isCreating = false;

  close(): void {
    this.modalClosed.emit();
  }

  createGroup(): void {
    if (!this.groupName.trim() || this.isCreating) return;

    this.isCreating = true;

    // Simulate API call delay
    setTimeout(() => {
      this.groupCreated.emit({
        name: this.groupName.trim(),
        description: this.groupDescription.trim(),
        isPublic: this.isPublic,
        selectedUsers: this.selectedUsers,
      });

      this.isCreating = false;
      this.resetForm();
    }, 1000);
  }

  private resetForm(): void {
    this.groupName = '';
    this.groupDescription = '';
    this.isPublic = true;
    this.selectedUsers = [];
    this.userSearchTerm = '';
  }

  toggleUser(user: User): void {
    const index = this.selectedUsers.findIndex((u) => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  }

  removeUser(user: User): void {
    const index = this.selectedUsers.findIndex((u) => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  isUserSelected(user: User): boolean {
    return this.selectedUsers.some((u) => u.id === user.id);
  }

  getFilteredUsers(): User[] {
    let filtered = this.users.filter(
      (user) => user.id !== this.currentUser.id && !this.isUserSelected(user)
    );

    if (this.userSearchTerm.trim()) {
      const term = this.userSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }

    // Sort by online status and then by name
    return filtered.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
