import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document } from '../../../core/models/document.model';

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-card.component.html',
  styleUrl: './document-card.component.css'
})
export class DocumentCardComponent {
  @Input() document!: Document;
  @Input() topicName: string = '';
  @Input() categoryNames: string[] = [];
  
  @Output() documentView = new EventEmitter<Document>();
  
  // Expose Math to template
  Math = Math;
  
  onViewClick(): void {
    this.documentView.emit(this.document);
  }
  
  formatDuration(duration: number | null | undefined): string {
    if (!duration) return 'N/A';
    return duration === 1 ? '1 phút' : `${duration} phút`;
  }
  
  generateStarsArray(rating: number): number[] {
    return Array.from({length: 5}, (_, i) => i + 1);
  }
}
