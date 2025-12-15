import { Component, HostListener, Inject, PLATFORM_ID, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-to-top.component.html',
  styleUrl: './back-to-top.component.css'
})
export class BackToTopComponent implements OnDestroy {
  isVisible = false;
  private readonly scrollThreshold = 300;
  private scrollTimeout: any;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}
  
  getButtonStyles(): string {
    // Desktop default - CSS media queries will handle mobile
    return 'bottom: 152px; right: 24px; width: 64px; height: 64px';
  }
  
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Throttle scroll events for better performance
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      
      this.scrollTimeout = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.isVisible = scrollTop > this.scrollThreshold;
      }, 10);
    }
  }
  
  @HostListener('window:resize', [])
  onWindowResize(): void {
    // Force update styles on resize to handle mobile/desktop transitions
    if (isPlatformBrowser(this.platformId)) {
      // Force change detection to update styles
      this.cdr.detectChanges();
    }
  }
  
  scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }
  
  ngOnDestroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }
}
