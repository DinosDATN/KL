import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-reports.component.html',
  styleUrls: ['./course-reports.component.css']
})
export class CourseReportsComponent implements OnInit {
  
  constructor() { }

  ngOnInit(): void {
    // Initialize course reports data
  }

}