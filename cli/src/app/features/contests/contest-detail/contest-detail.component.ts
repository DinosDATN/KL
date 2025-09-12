import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Contest, ContestProblem } from '../../../core/models/contest.model';
import { ContestService } from '../../../core/services/contest.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-contest-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contest-detail.component.html',
  styleUrl: './contest-detail.component.css'
})
export class ContestDetailComponent implements OnInit {
  contest: Contest | null = null;
  contestProblems: ContestProblem[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public contestService: ContestService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const contestId = this.route.snapshot.paramMap.get('id');
    if (contestId) {
      this.loadContestDetail(parseInt(contestId));
    } else {
      this.error = 'Contest ID not found';
      this.loading = false;
    }
  }

  private loadContestDetail(id: number): void {
    this.contestService.getContestById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.contest = response.data;
          this.loadContestProblems(id);
        } else {
          this.error = 'Failed to load contest details';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading contest:', error);
        this.error = 'Error loading contest details';
        this.loading = false;
      }
    });
  }

  private loadContestProblems(contestId: number): void {
    this.contestService.getContestProblems(contestId).subscribe({
      next: (response) => {
        if (response.success) {
          this.contestProblems = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contest problems:', error);
        this.loading = false;
      }
    });
  }

  onRegisterToggle(): void {
    if (!this.contest || !this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const action = this.contest.is_registered 
      ? this.contestService.unregisterFromContest(this.contest.id)
      : this.contestService.registerForContest(this.contest.id);

    action.subscribe({
      next: (response) => {
        if (response.success && this.contest) {
          this.contest.is_registered = !this.contest.is_registered;
          if (this.contest.participant_count !== undefined) {
            this.contest.participant_count += this.contest.is_registered ? 1 : -1;
          }
        }
      },
      error: (error) => {
        console.error('Error toggling registration:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/contests']);
  }
}
