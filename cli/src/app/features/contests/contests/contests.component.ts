import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Contest, ContestFilters } from '../../../core/models/contest.model';
import { ContestService } from '../../../core/services/contest.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ContestBannerComponent } from '../components/contest-banner/contest-banner.component';
import { ContestCardComponent } from '../components/contest-card/contest-card.component';
import { ContestFiltersComponent } from '../components/contest-filters/contest-filters.component';

@Component({
  selector: 'app-contests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContestBannerComponent,
    ContestCardComponent,
    ContestFiltersComponent
  ],
  templateUrl: './contests.component.html',
  styleUrl: './contests.component.css'
})
export class ContestsComponent implements OnInit {
  contests: Contest[] = [];
  filteredContests: Contest[] = [];
  activeContests: Contest[] = [];
  upcomingContests: Contest[] = [];

  // Filter and search properties
  filters: ContestFilters = { status: 'all' };
  topSearchTerm: string = '';

  // Pagination with Load More
  currentLoadCount: number = 6;
  itemsPerLoad: number = 6;

  // Loading states
  loading: boolean = false;
  loadingMore: boolean = false;
  loadingAction: boolean = false;

  // Mobile filter state
  mobileFiltersOpen: boolean = false;

  // Pagination info
  currentPage: number = 1;
  totalPages: number = 1;
  totalContests: number = 0;

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private contestService: ContestService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  private loadData(): void {
    this.loading = true;
    
    // Load all contests for filtering
    this.contestService.getAllContests(1, 50, this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.contests = response.data;
          this.totalContests = response.pagination?.total_items || response.data.length;
          this.loadQuickStats();
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading contests:', error);
        this.loading = false;
      }
    });
  }

  private loadQuickStats(): void {
    // Load active contests for banner
    this.contestService.getActiveContests().subscribe({
      next: (response) => {
        if (response.success) {
          this.activeContests = response.data;
        }
      },
      error: (error) => console.error('Error loading active contests:', error)
    });

    // Load upcoming contests for banner
    this.contestService.getUpcomingContests().subscribe({
      next: (response) => {
        if (response.success) {
          this.upcomingContests = response.data;
        }
      },
      error: (error) => console.error('Error loading upcoming contests:', error)
    });
  }

  onTopSearchChange(): void {
    this.filters.searchTerm = this.topSearchTerm;
    this.currentLoadCount = this.itemsPerLoad;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.contests];

    // Search filter
    if (this.filters.searchTerm?.trim()) {
      const term = this.filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(contest => 
        contest.title.toLowerCase().includes(term) ||
        (contest.description && contest.description.toLowerCase().includes(term)) ||
        (contest.Creator && contest.Creator.name.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.filters.status && this.filters.status !== 'all') {
      filtered = filtered.filter(contest => contest.status === this.filters.status);
    }

    // Creator filter
    if (this.filters.created_by) {
      filtered = filtered.filter(contest => contest.created_by === this.filters.created_by);
    }

    // Sort by status priority and start time
    filtered.sort((a, b) => {
      const statusPriority = { 'active': 3, 'upcoming': 2, 'completed': 1 };
      const aPriority = statusPriority[a.status || 'completed'] || 0;
      const bPriority = statusPriority[b.status || 'completed'] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

    this.filteredContests = filtered;
  }

  get displayedContests(): Contest[] {
    return this.filteredContests.slice(0, this.currentLoadCount);
  }

  get hasMoreContests(): boolean {
    return this.currentLoadCount < this.filteredContests.length;
  }

  onFiltersChange(newFilters: ContestFilters): void {
    this.filters = { ...newFilters };
    this.topSearchTerm = this.filters.searchTerm || '';
    this.currentLoadCount = this.itemsPerLoad;
    this.applyFilters();
  }

  onClearFilters(): void {
    this.filters = { status: 'all' };
    this.topSearchTerm = '';
    this.currentLoadCount = this.itemsPerLoad;
    this.applyFilters();
  }

  loadMoreContests(): void {
    this.loadingMore = true;
    
    setTimeout(() => {
      this.currentLoadCount += this.itemsPerLoad;
      this.loadingMore = false;
    }, 300);
  }

  onContestView(contest: Contest): void {
    this.router.navigate(['/contests', contest.id]);
  }

  onContestRegister(contest: Contest): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadingAction = true;
    this.contestService.registerForContest(contest.id).subscribe({
      next: (response) => {
        if (response.success) {
          contest.is_registered = true;
          if (contest.participant_count !== undefined) {
            contest.participant_count++;
          }
          // Show success message
          console.log('Registered successfully');
        }
        this.loadingAction = false;
      },
      error: (error) => {
        console.error('Error registering for contest:', error);
        this.loadingAction = false;
      }
    });
  }

  onContestUnregister(contest: Contest): void {
    this.loadingAction = true;
    this.contestService.unregisterFromContest(contest.id).subscribe({
      next: (response) => {
        if (response.success) {
          contest.is_registered = false;
          if (contest.participant_count !== undefined && contest.participant_count > 0) {
            contest.participant_count--;
          }
          // Show success message
          console.log('Unregistered successfully');
        }
        this.loadingAction = false;
      },
      error: (error) => {
        console.error('Error unregistering from contest:', error);
        this.loadingAction = false;
      }
    });
  }

  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }

  closeMobileFilters(): void {
    this.mobileFiltersOpen = false;
  }

  trackByContestId(index: number, contest: Contest): number {
    return contest.id;
  }

  clearTopSearch(): void {
    this.topSearchTerm = '';
    this.filters.searchTerm = '';
    this.currentLoadCount = this.itemsPerLoad;
    this.applyFilters();
  }
}
