import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomepageMockDataService } from '../../core/services/homepage-mock-data.service';
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
export class HomepageComponent implements OnInit {
  overview: any;
  featuredCourses: Course[] = [];
  featuredDocuments: Document[] = [];
  featuredProblems: Problem[] = [];
  leaderboard: (User & { xp: number; level: number })[] = [];
  testimonials: Testimonial[] = [];
  achievements: any[] = [];
  
  constructor(
    private homepageService: HomepageMockDataService,
    public themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    this.loadHomepageData();
  }
  
  private loadHomepageData(): void {
    // Load overview stats
    this.homepageService.getOverview().subscribe(data => {
      this.overview = data;
    });
    
    // Load featured courses
    this.homepageService.getFeaturedCourses().subscribe(courses => {
      this.featuredCourses = courses;
    });
    
    // Load featured documents
    this.homepageService.getFeaturedDocuments().subscribe(documents => {
      this.featuredDocuments = documents;
    });
    
    // Load featured problems
    this.homepageService.getFeaturedProblems().subscribe(problems => {
      this.featuredProblems = problems;
    });
    
    // Load leaderboard
    this.homepageService.getLeaderboard().subscribe(users => {
      this.leaderboard = users;
    });
    
    // Load testimonials
    this.homepageService.getTestimonials().subscribe(testimonials => {
      this.testimonials = testimonials;
    });
    
    // Load achievements
    this.homepageService.getFeaturedAchievements().subscribe(achievements => {
      this.achievements = achievements;
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
