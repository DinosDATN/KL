import { Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard } from './core/guards/auth.guard';

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
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
