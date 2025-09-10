import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.css'
})
export class PlaceholderComponent {
  title = 'Coming Soon';
  description = 'This page is under development.';
}
