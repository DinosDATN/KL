import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
export class CourseListComponent implements OnChanges {
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
  @Output() editContent = new EventEmitter<AdminCourse>();
  @Output() deleteCourse = new EventEmitter<number>();
  @Output() restoreCourse = new EventEmitter<number>();
  @Output() statusChange = new EventEmitter<{
    courseId: number;
    status: string;
  }>();
  @Output() sortChange = new EventEmitter<{
    sortBy: string;
    order: 'asc' | 'desc';
  }>();
  @Output() pageChange = new EventEmitter<number>();

  // Expose Math for template
  Math = Math;

  selectAllChecked = false;
  updatingStatus: { [courseId: number]: boolean } = {};

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

  onEditContent(course: AdminCourse): void {
    this.editContent.emit(course);
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

  onStatusChange(courseId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    const oldStatus = this.courses.find(c => c.id === courseId)?.status;
    
    // Prevent unnecessary updates
    if (oldStatus === newStatus) {
      return;
    }
    
    // Set loading state
    this.updatingStatus[courseId] = true;
    
    // Emit event
    this.statusChange.emit({ courseId, status: newStatus });
  }

  isUpdatingStatus(courseId: number): boolean {
    return this.updatingStatus[courseId] || false;
  }

  getStatusOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' },
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset updating status when courses change (after successful update)
    if (changes['courses'] && !changes['courses'].firstChange) {
      const previousCourses = changes['courses'].previousValue as AdminCourse[] || [];
      const currentCourses = changes['courses'].currentValue as AdminCourse[] || [];
      
      // Clear updating status for all courses that are in updating state
      // Check if their status has been updated or if they still exist
      Object.keys(this.updatingStatus).forEach(courseIdStr => {
        const courseId = parseInt(courseIdStr);
        const currentCourse = currentCourses.find(c => c.id === courseId);
        const prevCourse = previousCourses.find(c => c.id === courseId);
        
        if (currentCourse) {
          // Course exists, check if status changed
          if (!prevCourse || prevCourse.status !== currentCourse.status) {
            // Status was updated, clear loading state
            delete this.updatingStatus[courseId];
          }
        } else {
          // Course no longer exists (might have been deleted), clear anyway
          delete this.updatingStatus[courseId];
        }
      });
    }
    
    // Also clear updating status when loading changes from true to false
    if (changes['loading']) {
      const wasLoading = changes['loading'].previousValue;
      const isLoading = changes['loading'].currentValue;
      
      // If loading finished, clear all updating statuses
      if (wasLoading && !isLoading) {
        this.updatingStatus = {};
      }
    }
  }
}
