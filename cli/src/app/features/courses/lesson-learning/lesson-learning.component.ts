import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Course, CourseCategory } from '../../../core/models/course.model';
import {
  CourseModule,
  CourseLesson,
} from '../../../core/models/course-module.model';
import { User } from '../../../core/models/user.model';
import {
  mockCourses,
  mockCourseCategories,
  mockInstructors,
  mockCourseModules,
  mockCourseLessons,
} from '../../../core/services/courses-mock-data';
import { LessonViewerComponent } from '../components/lesson-viewer/lesson-viewer.component';

@Component({
  selector: 'app-lesson-learning',
  standalone: true,
  imports: [CommonModule, LessonViewerComponent],
  templateUrl: './lesson-learning.component.html',
  styleUrl: './lesson-learning.component.css',
})
export class LessonLearningComponent implements OnInit {
  course: Course | null = null;
  instructor: User | null = null;
  category: CourseCategory | null = null;
  courseModules: CourseModule[] = [];
  courseLessons: CourseLesson[] = [];
  currentLesson: CourseLesson | null = null;
  loading = true;
  sidebarOpen = false;

  // Progress tracking
  completedLessons = new Set<number>();
  currentLessonIndex = 0;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const courseId = Number(params.get('courseId'));
      const lessonId = Number(params.get('lessonId'));

      if (courseId && lessonId) {
        this.loadLearningData(courseId, lessonId);
      } else {
        this.router.navigate(['/courses']);
      }
    });
  }

  private loadLearningData(courseId: number, lessonId: number): void {
    this.loading = true;

    setTimeout(() => {
      // Find course
      this.course = mockCourses.find((c) => c.id === courseId) || null;

      if (this.course) {
        // Find instructor
        this.instructor =
          mockInstructors.find((i) => i.id === this.course!.instructor_id) ||
          null;

        // Find category
        this.category =
          mockCourseCategories.find((c) => c.id === this.course!.category_id) ||
          null;

        // Find course modules
        this.courseModules = mockCourseModules.filter(
          (m) => m.course_id === courseId
        );

        // Find course lessons
        const moduleIds = this.courseModules.map((m) => m.id);
        this.courseLessons = mockCourseLessons
          .filter((l) => moduleIds.includes(l.module_id))
          .sort((a, b) => {
            const moduleA = this.courseModules.find(
              (m) => m.id === a.module_id
            );
            const moduleB = this.courseModules.find(
              (m) => m.id === b.module_id
            );
            if (moduleA && moduleB && moduleA.position !== moduleB.position) {
              return (moduleA.position || 0) - (moduleB.position || 0);
            }
            return (a.position || 0) - (b.position || 0);
          });

        // Find current lesson
        this.currentLesson =
          this.courseLessons.find((l) => l.id === lessonId) || null;
        this.currentLessonIndex = this.courseLessons.findIndex(
          (l) => l.id === lessonId
        );

        // Load progress (simulate from localStorage)
        this.loadProgress();
      }

      this.loading = false;
    }, 300);
  }

  private loadProgress(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`course-${this.course?.id}-progress`);
      if (saved) {
        this.completedLessons = new Set(JSON.parse(saved));
      }
    }
  }

  private saveProgress(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `course-${this.course?.id}-progress`,
        JSON.stringify([...this.completedLessons])
      );
    }
  }

  selectLesson(lesson: CourseLesson): void {
    if (lesson.id === this.currentLesson?.id) return;

    this.router.navigate(['/courses', this.course?.id, 'lessons', lesson.id]);
  }

  toggleLessonComplete(): void {
    if (!this.currentLesson) return;

    if (this.completedLessons.has(this.currentLesson.id)) {
      this.completedLessons.delete(this.currentLesson.id);
    } else {
      this.completedLessons.add(this.currentLesson.id);
    }

    this.saveProgress();
  }

  goToNextLesson(): void {
    if (this.currentLessonIndex < this.courseLessons.length - 1) {
      const nextLesson = this.courseLessons[this.currentLessonIndex + 1];
      this.selectLesson(nextLesson);
    }
  }

  goToPreviousLesson(): void {
    if (this.currentLessonIndex > 0) {
      const prevLesson = this.courseLessons[this.currentLessonIndex - 1];
      this.selectLesson(prevLesson);
    }
  }

  backToCourse(): void {
    this.router.navigate(['/courses', this.course?.id]);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.completedLessons.has(lessonId);
  }

  getProgressPercentage(): number {
    if (this.courseLessons.length === 0) return 0;
    return Math.round(
      (this.completedLessons.size / this.courseLessons.length) * 100
    );
  }

  getModuleLessons(moduleId: number): CourseLesson[] {
    return this.courseLessons.filter((lesson) => lesson.module_id === moduleId);
  }

  getLessonTypeLabel(type: string): string {
    switch (type) {
      case 'video':
        return 'Video';
      case 'document':
        return 'Tài liệu';
      case 'quiz':
      case 'exercise':
        return 'Quiz';
      default:
        return 'Bài học';
    }
  }

  // Helper methods for navigation
  getPreviousLesson(): CourseLesson | null {
    if (this.currentLessonIndex > 0) {
      return this.courseLessons[this.currentLessonIndex - 1];
    }
    return null;
  }

  getNextLesson(): CourseLesson | null {
    if (this.currentLessonIndex < this.courseLessons.length - 1) {
      return this.courseLessons[this.currentLessonIndex + 1];
    }
    return null;
  }
}
