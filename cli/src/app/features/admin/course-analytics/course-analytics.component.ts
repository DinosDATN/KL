import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-analytics.component.html',
  styleUrls: ['./course-analytics.component.css']
})
export class CourseAnalyticsComponent implements OnInit {
  
  constructor() { }

  ngOnInit(): void {
    // Initialize course analytics data
  }

}