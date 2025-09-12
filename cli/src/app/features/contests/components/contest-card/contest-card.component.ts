import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Contest } from '../../../../core/models/contest.model';
import { ContestService } from '../../../../core/services/contest.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-contest-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contest-card.component.html',
  styleUrl: './contest-card.component.css'
})
export class ContestCardComponent {
  @Input() contest!: Contest;
  @Output() contestView = new EventEmitter<Contest>();
  @Output() contestRegister = new EventEmitter<Contest>();
  @Output() contestUnregister = new EventEmitter<Contest>();

  constructor(
    public contestService: ContestService,
    public authService: AuthService
  ) {}

  onViewContest(): void {
    this.contestView.emit(this.contest);
  }

  onRegisterToggle(): void {
    if (this.contest.is_registered) {
      this.contestUnregister.emit(this.contest);
    } else {
      this.contestRegister.emit(this.contest);
    }
  }

  get canRegister(): boolean {
    return this.contest.status === 'upcoming' || this.contest.status === 'active';
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
