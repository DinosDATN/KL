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
        path: 'instructors',
        loadComponent: () =>
          import(
            './features/admin/instructor-management/instructor-management.component'
          ).then((m) => m.InstructorManagementComponent),
      },
      {
        path: 'admins',
        loadComponent: () =>
          import(
            './features/admin/admin-management/admin-management.component'
          ).then((m) => m.AdminManagementComponent),
      },
      {
        path: 'courses/analytics',
        loadComponent: () =>
          import(
            './features/admin/course-analytics/course-analytics.component'
          ).then((m) => m.CourseAnalyticsComponent),
      },
      {
        path: 'courses/reports',
        loadComponent: () =>
          import(
            './features/admin/course-reports/course-reports.component'
          ).then((m) => m.CourseReportsComponent),
      },
      {
        path: 'lessons',
        loadComponent: () =>
          import(
            './features/admin/lesson-management/lesson-management.component'
          ).then((m) => m.LessonManagementComponent),
      },
      {
        path: 'document-lessons',
        loadComponent: () =>
          import(
            './features/admin/document-lesson-management/document-lesson-management.component'
          ).then((m) => m.DocumentLessonManagementComponent),
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
        path: 'payments',
        loadComponent: () =>
          import(
            './features/admin/payment-management/payment-management.component'
          ).then((m) => m.PaymentManagementComponent),
      },
      {
        path: 'payments/analytics',
        loadComponent: () =>
          import(
            './features/admin/payment-analytics/payment-analytics.component'
          ).then((m) => m.PaymentAnalyticsComponent),
      },
      {
        path: 'payments/coupons',
        loadComponent: () =>
          import(
            './features/admin/coupon-management/coupon-management.component'
          ).then((m) => m.CouponManagementComponent),
      },
      {
        path: 'bank-accounts',
        loadComponent: () =>
          import(
            './features/admin/bank-accounts/bank-accounts-admin.component'
          ).then((m) => m.BankAccountsAdminComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import(
            './features/admin/reports-management/reports-management.component'
          ).then((m) => m.ReportsManagementComponent),
      },
      {
        path: 'reports/bugs',
        loadComponent: () =>
          import('./features/admin/bug-reports/bug-reports.component').then(
            (m) => m.BugReportsComponent
          ),
      },
      {
        path: 'reports/feedback',
        loadComponent: () =>
          import(
            './features/admin/feedback-management/feedback-management.component'
          ).then((m) => m.FeedbackManagementComponent),
      },
      {
        path: 'reports/violations',
        loadComponent: () =>
          import(
            './features/admin/violation-management/violation-management.component'
          ).then((m) => m.ViolationManagementComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/admin/notification-management/notification-management.component'
          ).then((m) => m.NotificationManagementComponent),
      },
      {
        path: 'notifications/send',
        loadComponent: () =>
          import(
            './features/admin/send-notification/send-notification.component'
          ).then((m) => m.SendNotificationComponent),
      },
      {
        path: 'notifications/templates',
        loadComponent: () =>
          import(
            './features/admin/notification-templates/notification-templates.component'
          ).then((m) => m.NotificationTemplatesComponent),
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
        path: 'courses/:id/payment',
        loadComponent: () =>
          import(
            './features/courses/course-payment/course-payment.component'
          ).then((m) => m.CoursePaymentComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'payment/bank-transfer/:id',
        loadComponent: () =>
          import(
            './features/courses/bank-transfer-info/bank-transfer-info.component'
          ).then((m) => m.BankTransferInfoComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'payment/vnpay-return',
        loadComponent: () =>
          import('./features/courses/vnpay-return/vnpay-return.component').then(
            (m) => m.VnpayReturnComponent
          ),
      },
      {
        path: 'courses/:id/learn',
        loadComponent: () =>
          import(
            './features/courses/lesson-learning/lesson-learning.component'
          ).then((m) => m.LessonLearningComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'courses/:courseId/lessons/:lessonId',
        loadComponent: () =>
          import(
            './features/courses/lesson-learning/lesson-learning.component'
          ).then((m) => m.LessonLearningComponent),
        canActivate: [AuthGuard],
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
        path: 'contests/:id/leaderboard',
        loadComponent: () =>
          import(
            './features/contests/components/contest-leaderboard/contest-leaderboard.component'
          ).then((m) => m.ContestLeaderboardComponent),
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
        path: 'profile/creator-application',
        loadComponent: () =>
          import('./features/profile/creator-application/creator-application.component').then(
            (m) => m.CreatorApplicationComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'profile/bank-account',
        loadComponent: () =>
          import('./features/profile/bank-account/bank-account.component').then(
            (m) => m.BankAccountComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/profile',
        loadComponent: () =>
          import('./features/profile/creator-profile.component').then(
            (m) => m.CreatorProfileComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/courses/:courseId/modules/:moduleId/lessons',
        loadComponent: () =>
          import(
            './features/creator/module-lessons/module-lessons.component'
          ).then((m) => m.ModuleLessonsComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/courses/:id/content',
        loadComponent: () =>
          import(
            './features/creator/course-content/course-content.component'
          ).then((m) => m.CourseContentComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/courses/:id/analytics',
        loadComponent: () =>
          import(
            './features/creator/course-analytics/course-analytics.component'
          ).then((m) => m.CourseAnalyticsComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/courses/:id/students',
        loadComponent: () =>
          import(
            './features/creator/course-students/course-students.component'
          ).then((m) => m.CourseStudentsComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/courses',
        loadComponent: () =>
          import(
            './features/creator/course-management/creator-course-management.component'
          ).then((m) => m.CreatorCourseManagementComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/contests',
        loadComponent: () =>
          import(
            './features/creator/contest-management/creator-contest-management.component'
          ).then((m) => m.CreatorContestManagementComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'creator/problems',
        loadComponent: () =>
          import(
            './features/creator/problem-management/creator-problem-management.component'
          ).then((m) => m.CreatorProblemManagementComponent),
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
      {
        path: 'games/sudoku',
        loadComponent: () =>
          import('./features/games/sudoku/sudoku.component').then(
            (m) => m.SudokuComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
