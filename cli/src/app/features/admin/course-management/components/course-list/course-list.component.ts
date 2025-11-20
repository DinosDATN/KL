import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCourse } from '../../../../../core/services/admin-course.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss',
})
export class CourseListComponent {
  @Input() courses: AdminCourse[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() selectedCourseIds: number[] = [];
  @Input() set showDeletedActions(value: boolean) {
    console.log('🔵 [CourseList] showDeletedActions set to:', value);
    this._showDeletedActions = value;
  }
  get showDeletedActions(): boolean {
    return this._showDeletedActions;
  }
  private _showDeletedActions = false;
  
  @Input() sortBy: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Input() currentPage = 1;
  @Input() itemsPerPage = 10;
  @Input() totalItems = 0;
  @Input() totalPages = 1;

  @Output() courseToggle = new EventEmitter<{
    courseId: number;
    selected: boolean;
  }>();
  @Output() selectAll = new EventEmitter<boolean>();
  @Output() viewCourse = new EventEmitter<AdminCourse>();
  @Output() editCourse = new EventEmitter<AdminCourse>();
  @Output() deleteCourse = new EventEmitter<number>();
  @Output() restoreCourse = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{
    sortBy: string;
    order: 'asc' | 'desc';
  }>();
  @Output() pageChange = new EventEmitter<number>();

  // Expose Math for template
  Math = Math;

  selectAllChecked = false;

  onSelectAll(): void {
    this.selectAllChecked = !this.selectAllChecked;
    this.selectAll.emit(this.selectAllChecked);
  }

  onCourseToggle(courseId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.courseToggle.emit({ courseId, selected: target.checked });
  }

  updateSelectAllState(): void {
    this.selectAllChecked =
      this.courses.length > 0 &&
      this.courses.every((c) => this.selectedCourseIds.includes(c.id));
  }

  isCourseSelected(courseId: number): boolean {
    return this.selectedCourseIds.includes(courseId);
  }

  onSort(field: string): void {
    const newOrder =
      this.sortBy === field && this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ sortBy: field, order: newOrder });
  }

  onView(course: AdminCourse): void {
    this.viewCourse.emit(course);
  }

  onEdit(course: AdminCourse): void {
    this.editCourse.emit(course);
  }

  onRestore(courseId: number): void {
    console.log('🔵 [CourseList] onRestore called with courseId:', courseId);
    console.log('🔵 [CourseList] Emitting restoreCourse event...');
    this.restoreCourse.emit(courseId);
    console.log('🔵 [CourseList] Event emitted');
  }

  onDelete(courseId: number): void {
    this.deleteCourse.emit(courseId);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getStatusColor(status: string): string {
    const colors = {
      published:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      draft:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      archived:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };
    return (
      colors[status as keyof typeof colors] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    );
  }
}
