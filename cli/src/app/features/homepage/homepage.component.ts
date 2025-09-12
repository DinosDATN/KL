import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { HomepageService } from '../../core/services/homepage.service';
import { ThemeService } from '../../core/services/theme.service';
import { Course } from '../../core/models/course.model';
import { Document } from '../../core/models/document.model';
import { Problem } from '../../core/models/problem.model';
import { User } from '../../core/models/user.model';
import { Testimonial } from '../../core/models/course.model';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit, OnDestroy {
  overview: any;
  featuredCourses: Course[] = [];
  featuredDocuments: Document[] = [];
  featuredProblems: Problem[] = [];
  leaderboard: (User & { xp: number; level: number })[] = [];
  testimonials: Testimonial[] = [];
  achievements: any[] = [];

  // Loading states
  isLoadingOverview = true;
  isLoadingCourses = true;
  isLoadingDocuments = true;
  isLoadingProblems = true;
  isLoadingLeaderboard = true;
  isLoadingTestimonials = true;
  isLoadingAchievements = true;

  // Error states
  overviewError: string | null = null;
  coursesError: string | null = null;
  documentsError: string | null = null;
  problemsError: string | null = null;
  leaderboardError: string | null = null;
  testimonialsError: string | null = null;
  achievementsError: string | null = null;

  // Subscription management
  private destroy$ = new Subject<void>();
  
  constructor(
    private homepageService: HomepageService,
    public themeService: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    // Only load data in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadHomepageData();
    }
  }
  
  private loadHomepageData(): void {
    // Load overview stats
    this.homepageService.getOverview()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingOverview = false)
      )
      .subscribe({
        next: (data) => {
          this.overview = data;
          this.overviewError = null;
        },
        error: (error) => {
          console.error('Failed to load overview data:', error);
          this.overviewError = error.message;
        }
      });
    
    // Load featured courses
    this.homepageService.getFeaturedCourses(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingCourses = false)
      )
      .subscribe({
        next: (courses) => {
          this.featuredCourses = courses;
          this.coursesError = null;
        },
        error: (error) => {
          console.error('Failed to load featured courses:', error);
          this.coursesError = error.message;
        }
      });
    
    // Load featured documents
    this.homepageService.getFeaturedDocuments(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDocuments = false)
      )
      .subscribe({
        next: (documents) => {
          this.featuredDocuments = documents;
          this.documentsError = null;
        },
        error: (error) => {
          console.error('Failed to load featured documents:', error);
          this.documentsError = error.message;
        }
      });
    
    // Load featured problems
    this.homepageService.getFeaturedProblems(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingProblems = false)
      )
      .subscribe({
        next: (problems) => {
          this.featuredProblems = problems;
          this.problemsError = null;
        },
        error: (error) => {
          console.error('Failed to load featured problems:', error);
          this.problemsError = error.message;
        }
      });
    
    // Load leaderboard
    this.homepageService.getLeaderboard(5)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingLeaderboard = false)
      )
      .subscribe({
        next: (users) => {
          this.leaderboard = users;
          this.leaderboardError = null;
        },
        error: (error) => {
          console.error('Failed to load leaderboard:', error);
          this.leaderboardError = error.message;
        }
      });
    
    // Load testimonials
    this.homepageService.getTestimonials(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingTestimonials = false)
      )
      .subscribe({
        next: (testimonials) => {
          this.testimonials = testimonials;
          this.testimonialsError = null;
        },
        error: (error) => {
          console.error('Failed to load testimonials:', error);
          this.testimonialsError = error.message;
        }
      });
    
    // Load achievements
    this.homepageService.getFeaturedAchievements(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingAchievements = false)
      )
      .subscribe({
        next: (achievements) => {
          this.achievements = achievements;
          this.achievementsError = null;
        },
        error: (error) => {
          console.error('Failed to load achievements:', error);
          this.achievementsError = error.message;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Utility method to check if any data is loading
  isAnyDataLoading(): boolean {
    return this.isLoadingOverview || this.isLoadingCourses || this.isLoadingDocuments ||
           this.isLoadingProblems || this.isLoadingLeaderboard || this.isLoadingTestimonials ||
           this.isLoadingAchievements;
  }

  // Utility method to check if there are any errors
  hasAnyErrors(): boolean {
    return !!(this.overviewError || this.coursesError || this.documentsError ||
              this.problemsError || this.leaderboardError || this.testimonialsError ||
              this.achievementsError);
  }

  // Method to retry failed requests
  retryFailedRequests(): void {
    if (this.overviewError) {
      this.isLoadingOverview = true;
      this.overviewError = null;
      this.loadOverviewData();
    }
    if (this.coursesError) {
      this.isLoadingCourses = true;
      this.coursesError = null;
      this.loadCoursesData();
    }
    if (this.documentsError) {
      this.isLoadingDocuments = true;
      this.documentsError = null;
      this.loadDocumentsData();
    }
    if (this.problemsError) {
      this.isLoadingProblems = true;
      this.problemsError = null;
      this.loadProblemsData();
    }
    if (this.leaderboardError) {
      this.isLoadingLeaderboard = true;
      this.leaderboardError = null;
      this.loadLeaderboardData();
    }
    if (this.testimonialsError) {
      this.isLoadingTestimonials = true;
      this.testimonialsError = null;
      this.loadTestimonialsData();
    }
    if (this.achievementsError) {
      this.isLoadingAchievements = true;
      this.achievementsError = null;
      this.loadAchievementsData();
    }
  }

  // Individual data loading methods for retry functionality
  private loadOverviewData(): void {
    this.homepageService.getOverview()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingOverview = false)
      )
      .subscribe({
        next: (data) => {
          this.overview = data;
          this.overviewError = null;
        },
        error: (error) => {
          console.error('Failed to load overview data:', error);
          this.overviewError = error.message;
        }
      });
  }

  private loadCoursesData(): void {
    this.homepageService.getFeaturedCourses(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingCourses = false)
      )
      .subscribe({
        next: (courses) => {
          this.featuredCourses = courses;
          this.coursesError = null;
        },
        error: (error) => {
          console.error('Failed to load featured courses:', error);
          this.coursesError = error.message;
        }
      });
  }

  private loadDocumentsData(): void {
    this.homepageService.getFeaturedDocuments(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDocuments = false)
      )
      .subscribe({
        next: (documents) => {
          this.featuredDocuments = documents;
          this.documentsError = null;
        },
        error: (error) => {
          console.error('Failed to load featured documents:', error);
          this.documentsError = error.message;
        }
      });
  }

  private loadProblemsData(): void {
    this.homepageService.getFeaturedProblems(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingProblems = false)
      )
      .subscribe({
        next: (problems) => {
          this.featuredProblems = problems;
          this.problemsError = null;
        },
        error: (error) => {
          console.error('Failed to load featured problems:', error);
          this.problemsError = error.message;
        }
      });
  }

  private loadLeaderboardData(): void {
    this.homepageService.getLeaderboard(5)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingLeaderboard = false)
      )
      .subscribe({
        next: (users) => {
          this.leaderboard = users;
          this.leaderboardError = null;
        },
        error: (error) => {
          console.error('Failed to load leaderboard:', error);
          this.leaderboardError = error.message;
        }
      });
  }

  private loadTestimonialsData(): void {
    this.homepageService.getTestimonials(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingTestimonials = false)
      )
      .subscribe({
        next: (testimonials) => {
          this.testimonials = testimonials;
          this.testimonialsError = null;
        },
        error: (error) => {
          console.error('Failed to load testimonials:', error);
          this.testimonialsError = error.message;
        }
      });
  }

  private loadAchievementsData(): void {
    this.homepageService.getFeaturedAchievements(6)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingAchievements = false)
      )
      .subscribe({
        next: (achievements) => {
          this.achievements = achievements;
          this.achievementsError = null;
        },
        error: (error) => {
          console.error('Failed to load achievements:', error);
          this.achievementsError = error.message;
        }
      });
  }
  
  formatDuration(minutes: number | null | undefined): string {
    if (!minutes) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
    }
    return `${mins}m`;
  }
  
  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
  
  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  }
  
  getDifficultyColor(difficulty: string): string {
    switch(difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'hard': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  }
}
