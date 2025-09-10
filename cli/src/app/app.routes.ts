import { Routes } from '@angular/router';

export const routes: Routes = [
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
          import('./features/problems/problem-detail/problem-detail.component').then(
            (m) => m.ProblemDetailComponent
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents.component').then(
            (m) => m.DocumentsComponent
          ),
      },
      {
        path: 'forum',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent
          ),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent
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
          import('./features/courses/course-detail/course-detail.component').then(
            (m) => m.CourseDetailComponent
          ),
      },
      {
        path: 'courses/:courseId/lessons/:lessonId',
        loadComponent: () =>
          import('./features/courses/lesson-learning/lesson-learning.component').then(
            (m) => m.LessonLearningComponent
          ),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then(
            (m) => m.PlaceholderComponent
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
