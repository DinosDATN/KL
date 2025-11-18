import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContestService } from '../../../../core/services/contest.service';
import { Contest, ContestLeaderboardEntry } from '../../../../core/models/contest.model';

@Component({
  selector: 'app-contest-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contest-leaderboard.component.html',
  styleUrl: './contest-leaderboard.component.css'
})
export class ContestLeaderboardComponent implements OnInit {
  contest: Contest | null = null;
  leaderboard: ContestLeaderboardEntry[] = [];
  loading = true;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 50;
  totalItems = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contestService: ContestService
  ) {}

  ngOnInit(): void {
    const contestId = this.route.snapshot.paramMap.get('id');
    if (contestId) {
      this.loadContestInfo(parseInt(contestId));
      this.loadLeaderboard(parseInt(contestId));
    } else {
      this.error = 'Contest ID not found';
      this.loading = false;
    }
  }

  private loadContestInfo(id: number): void {
    this.contestService.getContestById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.contest = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading contest:', error);
      }
    });
  }

  private loadLeaderboard(contestId: number): void {
    this.contestService.getContestLeaderboard(contestId, this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboard = response.data;
          this.totalItems = response.pagination?.total_items || response.data.length;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
        this.error = 'Failed to load leaderboard';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    if (this.contest) {
      this.router.navigate(['/contests', this.contest.id]);
    } else {
      this.router.navigate(['/contests']);
    }
  }

  getRankColor(rank: number): string {
    if (rank === 1) return 'text-yellow-500'; // Gold
    if (rank === 2) return 'text-gray-400'; // Silver
    if (rank === 3) return 'text-orange-600'; // Bronze
    return 'text-gray-600 dark:text-gray-400';
  }

  getRankIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  getContestStatusColor(status?: string): string {
    return this.contestService.getContestStatusColor(status);
  }
}
