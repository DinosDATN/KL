import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-courses-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './courses-banner.component.html',
  styleUrl: './courses-banner.component.css'
})
export class CoursesBannerComponent {
  @Input() totalCourses: number = 0;
  @Input() loading: boolean = false;
}
