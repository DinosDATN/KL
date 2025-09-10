import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { BackToTopComponent } from '../../components/back-to-top/back-to-top.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, BackToTopComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isMobile = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public themeService: ThemeService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 768;
    } else {
      this.isMobile = false;
    }
  }
}
