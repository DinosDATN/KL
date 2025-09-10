import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-problems-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './problems-banner.component.html',
  styleUrl: './problems-banner.component.css'
})
export class ProblemsBannerComponent {
  @Input() totalProblems: number = 0;
  @Input() loading: boolean = false;
}
