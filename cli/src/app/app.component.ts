import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatAiWidgetComponent } from './shared/components/chat-ai-widget/chat-ai-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatAiWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'cli';
}
