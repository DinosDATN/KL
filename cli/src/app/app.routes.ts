import { Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Authentication routes (no layout)
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [NoAuthGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [NoAuthGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/oauth-callback/oauth-callback.component').then(
        (m) => m.OAuthCallbackComponent
      ),
  },
  // Admin layout routes
  {
    path: 'admin',
    loadComponent: () =>
      import('./shared/layout/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'courses',
        loadComponent: () =>
          import(
            './features/admin/course-management/course-management.component'
          ).then((m) => m.CourseManagementComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import(
            './features/admin/user-management/user-management.component'
          ).then((m) => m.UserManagementComponent),
      },
      {
        path: 'users/analytics',
        loadComponent: () =>
          import(
            './features/admin/user-analytics/user-analytics.component'
          ).then((m) => m.UserAnalyticsComponent),
      },
      {
        path: 'users/reports',
        loadComponent: () =>
          import('./features/admin/user-reports/user-reports.component').then(
            (m) => m.UserReportsComponent
          ),
      },
      {
        path: 'courses/analytics',
        loadComponent: () =>
          import('./features/admin/course-analytics/course-analytics.component').then(
            (m) => m.CourseAnalyticsComponent
          ),
      },
      {
        path: 'courses/reports',
        loadComponent: () =>
          import('./features/admin/course-reports/course-reports.component').then(
            (m) => m.CourseReportsComponent
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import(
            './features/admin/document-management/document-management.component'
          ).then((m) => m.DocumentManagementComponent),
      },
      {
        path: 'problems',
        loadComponent: () =>
          import(
            './features/admin/problem-management/problem-management.component'
          ).then((m) => m.ProblemManagementComponent),
      },
      {
        path: 'contests',
        loadComponent: () =>
          import(
            './features/admin/contest-management/contest-management.component'
          ).then((m) => m.ContestManagementComponent),
      },
      {
        path: 'contests/analytics',
        loadComponent: () =>
          import(
            './features/admin/contest-analytics/contest-analytics.component'
          ).then((m) => m.ContestAnalyticsComponent),
      },
      {
        path: 'analytics/platform',
        loadComponent: () =>
          import(
            './features/admin/platform-analytics/platform-analytics.component'
          ).then((m) => m.PlatformAnalyticsComponent),
      },
      {
        path: 'analytics/engagement',
        loadComponent: () =>
          import(
            './features/admin/engagement-analytics/engagement-analytics.component'
          ).then((m) => m.EngagementAnalyticsComponent),
      },
      {
        path: 'analytics/revenue',
        loadComponent: () =>
          import(
            './features/admin/revenue-reports/revenue-reports.component'
          ).then((m) => m.RevenueReportsComponent),
      },
      {
        path: 'system/settings',
        loadComponent: () =>
          import(
            './features/admin/system-settings/system-settings.component'
          ).then((m) => m.SystemSettingsComponent),
      },
      {
        path: 'system/logs',
        loadComponent: () =>
          import('./features/admin/system-logs/system-logs.component').then(
            (m) => m.SystemLogsComponent
          ),
      },
      {
        path: 'system/backups',
        loadComponent: () =>
          import(
            './features/admin/system-backups/system-backups.component'
          ).then((m) => m.SystemBackupsComponent),
      },
    ],
  },
  // Main layout routes
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/homepage/homepage.component').then(
            (m) => m.HomepageComponent
          ),
      },
      {
        path: 'home',
        redirectTo: '',
        pathMatch: 'full',
      },

      {
        path: 'problems',
        loadComponent: () =>
          import('./features/problems/problems.component').then(
            (m) => m.ProblemsComponent
          ),
      },
      {
        path: 'problems/:id',
        loadComponent: () =>
          import(
            './features/problems/problem-detail/problem-detail.component'
          ).then((m) => m.ProblemDetailComponent),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents.component').then(
            (m) => m.DocumentsComponent
          ),
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import(
            './features/documents/document-detail/document-detail.component'
          ).then((m) => m.DocumentDetailComponent),
      },
      {
        path: 'forum',
        loadComponent: () =>
          import('./features/forum/forum.component').then(
            (m) => m.ForumComponent
          ),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./features/leaderboard/leaderboard.component').then(
            (m) => m.LeaderboardComponent
          ),
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./features/courses/courses/courses.component').then(
            (m) => m.CoursesComponent
          ),
      },
      {
        path: 'courses/:id',
        loadComponent: () =>
          import(
            './features/courses/course-detail/course-detail.component'
          ).then((m) => m.CourseDetailComponent),
      },
      {
        path: 'courses/:courseId/lessons/:lessonId',
        loadComponent: () =>
          import(
            './features/courses/lesson-learning/lesson-learning.component'
          ).then((m) => m.LessonLearningComponent),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent
          ),
      },
      {
        path: 'contests',
        loadComponent: () =>
          import('./features/contests/contests/contests.component').then(
            (m) => m.ContestsComponent
          ),
      },
      {
        path: 'contests/:id',
        loadComponent: () =>
          import(
            './features/contests/contest-detail/contest-detail.component'
          ).then((m) => m.ContestDetailComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'grading-board',
        loadComponent: () =>
          import('./grading-board/grading-board.component').then(
            (m) => m.GradingBoardComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat.component').then((m) => m.ChatComponent),
        canActivate: [AuthGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
