import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import {
  User,
  UserProfile,
  UserStat,
  UserGoal,
  Achievement,
  UserAchievement,
  UserActivityLog,
} from '../../core/models/user.model';
import { Course, CourseEnrollment } from '../../core/models/course.model';
import { Badge, UserBadge } from '../../core/models/gamification.model';
import { Quiz, UserQuizResult } from '../../core/models/quiz.model';
import { Problem, Submission } from '../../core/models/problem.model';
import {
  mockUser,
  mockUserProfile,
  mockUserStat,
  mockUserGoals,
  mockAchievements,
  mockUserAchievements,
  mockUserActivityLogs,
  mockCourses,
  mockCourseEnrollments,
  mockBadges,
  mockUserBadges,
  mockQuizzes,
  mockUserQuizResults,
  mockProblems,
  mockSubmissions,
} from '../../core/services/profile-mock-data';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // Data properties
  user: User = mockUser;
  userProfile: UserProfile = mockUserProfile;
  userStat: UserStat = mockUserStat;
  userGoals: UserGoal[] = mockUserGoals;
  achievements: Achievement[] = mockAchievements;
  userAchievements: UserAchievement[] = mockUserAchievements;
  userActivityLogs: UserActivityLog[] = mockUserActivityLogs;
  courses: Course[] = mockCourses;
  courseEnrollments: CourseEnrollment[] = mockCourseEnrollments;
  badges: Badge[] = mockBadges;
  userBadges: UserBadge[] = mockUserBadges;
  quizzes: Quiz[] = mockQuizzes;
  userQuizResults: UserQuizResult[] = mockUserQuizResults;
  problems: Problem[] = mockProblems;
  submissions: Submission[] = mockSubmissions;

  // UI state
  activeTab: 'overview' | 'activity' | 'achievements' | 'courses' | 'settings' = 'overview';

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {}

  // Helper methods
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getProgressPercentage(current: number, target: number): number {
    return Math.min((current / target) * 100, 100);
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'epic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'course_started':
        return '📚';
      case 'course_completed':
        return '🎓';
      case 'quiz_taken':
        return '📝';
      case 'problem_solved':
        return '✅';
      case 'badge_earned':
        return '🏆';
      case 'course_published':
        return '📖';
      default:
        return '⚡';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  setActiveTab(tab: 'overview' | 'activity' | 'achievements' | 'courses' | 'settings'): void {
    this.activeTab = tab;
  }

  // Get user's completed achievements
  getUserAchievements(): { achievement: Achievement; dateEarned: string }[] {
    return this.userAchievements.map(ua => {
      const achievement = this.achievements.find(a => a.id === ua.achievement_id);
      return {
        achievement: achievement!,
        dateEarned: ua.date_earned
      };
    }).filter(item => item.achievement);
  }

  // Get user's enrolled courses with progress
  getUserCourses(): { course: Course; enrollment: CourseEnrollment }[] {
    return this.courseEnrollments.map(enrollment => {
      const course = this.courses.find(c => c.id === enrollment.course_id);
      return {
        course: course!,
        enrollment
      };
    }).filter(item => item.course);
  }

  // Get recent submissions
  getRecentSubmissions(): { submission: Submission; problem: Problem }[] {
    return this.submissions.map(submission => {
      const problem = this.problems.find(p => p.id === submission.problem_id);
      return {
        submission,
        problem: problem!
      };
    }).filter(item => item.problem)
      .sort((a, b) => new Date(b.submission.submitted_at).getTime() - new Date(a.submission.submitted_at).getTime())
      .slice(0, 5);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'wrong-answer':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'time-limit-exceeded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
}
