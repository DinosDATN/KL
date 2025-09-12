import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Contest } from '../../../../core/models/contest.model';
import { ContestService } from '../../../../core/services/contest.service';

@Component({
  selector: 'app-contest-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contest-banner.component.html',
  styleUrl: './contest-banner.component.css'
})
export class ContestBannerComponent {
  @Input() totalContests: number = 0;
  @Input() loading: boolean = false;
  @Input() activeContests: Contest[] = [];
  @Input() upcomingContests: Contest[] = [];

  constructor(public contestService: ContestService) {}

  trackByContestId(index: number, contest: Contest): number {
    return contest.id;
  }
}
