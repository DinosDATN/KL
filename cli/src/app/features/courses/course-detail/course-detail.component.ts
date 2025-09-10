import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Course, CourseCategory } from '../../../core/models/course.model';
import { CourseModule, CourseLesson } from '../../../core/models/course-module.model';
import { User } from '../../../core/models/user.model';
import { 
  mockCourses, 
  mockCourseCategories, 
  mockInstructors, 
  mockCourseModules, 
  mockCourseLessons,
  mockCourseReviews 
} from '../../../core/services/courses-mock-data';
import { CourseCardComponent } from '../components/course-card/course-card.component';
import { LessonViewerComponent } from '../components/lesson-viewer/lesson-viewer.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, CourseCardComponent, LessonViewerComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css'
})
export class CourseDetailComponent implements OnInit {
  course: Course | null = null;
  instructor: User | null = null;
  category: CourseCategory | null = null;
  courseModules: CourseModule[] = [];
  courseLessons: CourseLesson[] = [];
  relatedCourses: Course[] = [];
  loading = true;
  Math = Math;
  mockInstructors = mockInstructors;
  selectedLesson: CourseLesson | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const courseId = Number(params.get('id'));
      if (courseId) {
        this.loadCourseDetail(courseId);
      } else {
        this.router.navigate(['/courses']);
      }
    });
  }

  private loadCourseDetail(courseId: number): void {
    this.loading = true;
    
    // Simulate loading delay
    setTimeout(() => {
      // Find course
      this.course = mockCourses.find(c => c.id === courseId) || null;
      
      if (this.course) {
        // Find instructor
        this.instructor = mockInstructors.find(i => i.id === this.course!.instructor_id) || null;
        
        // Find category
        this.category = mockCourseCategories.find(c => c.id === this.course!.category_id) || null;
        
        // Find course modules
        this.courseModules = mockCourseModules.filter(m => m.course_id === courseId);
        
        // Find course lessons
        const moduleIds = this.courseModules.map(m => m.id);
        this.courseLessons = mockCourseLessons.filter(l => moduleIds.includes(l.module_id));
        
        // Select first lesson by position if available
        this.selectedLesson = this.courseLessons.sort((a,b) => (a.position||0) - (b.position||0))[0] || null;
        
        // Find related courses (same category, excluding current course)
        this.relatedCourses = mockCourses
          .filter(c => c.category_id === this.course!.category_id && c.id !== courseId)
          .slice(0, 3);
      }
      
      this.loading = false;
    }, 500);
  }

  onEnrollClick(): void {
    if (this.course) {
      console.log('Enrolling in course:', this.course.title);
      // Add enrollment logic here
    }
  }

  onRelatedCourseClick(course: Course): void {
    this.router.navigate(['/courses', course.id]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  formatDuration(duration: number | null | undefined): string {
    if (!duration) return 'N/A';
    return duration === 1 ? '1 giờ' : `${duration} giờ`;
  }

  generateStarsArray(rating: number): number[] {
    return Array.from({length: 5}, (_, i) => i + 1);
  }

  getTotalLessons(): number {
    return this.courseLessons.length;
  }

  getTotalDuration(): number {
    return this.courseLessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }

  getCourseReviews() {
    if (!this.course) return [];
    return mockCourseReviews.filter(r => r.course_id === this.course!.id);
  }

  getAverageRating(): number {
    const reviews = this.getCourseReviews();
    if (reviews.length === 0) return this.course?.rating || 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }

  getModuleLessons(moduleId: number): CourseLesson[] {
    return this.courseLessons.filter(lesson => lesson.module_id === moduleId)
      .sort((a,b) => (a.position || 0) - (b.position || 0));
  }

  selectLesson(lesson: CourseLesson): void {
    // Navigate to lesson learning page instead of showing inline
    this.router.navigate(['/courses', this.course?.id, 'lessons', lesson.id]);
  }

  getInstructorName(instructorId: number): string {
    const instructor = mockInstructors.find(i => i.id === instructorId);
    return instructor ? instructor.name : 'Unknown Instructor';
  }
}
