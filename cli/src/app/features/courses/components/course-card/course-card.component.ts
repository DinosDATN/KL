import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course } from '../../../../core/models/course.model';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css'
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() instructorName: string = '';
  @Output() enrollClick = new EventEmitter<Course>();
  
  Math = Math;
  
  onEnrollClick(): void {
    this.enrollClick.emit(this.course);
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
}
