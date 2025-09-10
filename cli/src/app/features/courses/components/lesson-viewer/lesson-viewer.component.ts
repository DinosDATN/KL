import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseLesson } from '../../../../core/models/course-module.model';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-viewer.component.html',
  styleUrl: './lesson-viewer.component.css'
})
export class LessonViewerComponent {
  @Input() lesson: CourseLesson | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  get isVideo(): boolean {
    return this.lesson?.type === 'video';
  }

  get isDocument(): boolean {
    return this.lesson?.type === 'document';
  }

  get isQuiz(): boolean {
    return this.lesson?.type === 'quiz' || this.lesson?.type === 'exercise';
  }

  get videoUrl(): SafeResourceUrl | null {
    if (!this.lesson?.content) return null;
    // If content is a YouTube URL, convert to embed URL.
    const url = this.lesson.content;
    let embed = url;
    const ytMatch = url.match(/(?:youtu\.be\/(.+)|v=([^&]+))/);
    if (ytMatch) {
      const id = ytMatch[1] || ytMatch[2];
      embed = `https://www.youtube.com/embed/${id}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }
}
