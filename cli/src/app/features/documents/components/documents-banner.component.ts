import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documents-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents-banner.component.html',
  styleUrl: './documents-banner.component.css'
})
export class DocumentsBannerComponent {
  @Input() totalDocuments: number = 0;
  @Input() loading: boolean = false;
}
