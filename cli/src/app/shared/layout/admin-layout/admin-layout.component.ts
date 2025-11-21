import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AdminSidebarComponent,
    AdminHeaderComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = true; // Default to collapsed for mobile
  currentTheme$: any;
  private resizeListener?: () => void;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentTheme$ = this.themeService.theme$;
    // Check if user has admin role
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/']);
    }

    // Initialize sidebar state based on screen size
    this.updateSidebarState();
    
    // Listen to window resize events
    if (typeof window !== 'undefined') {
      this.resizeListener = () => this.updateSidebarState();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy() {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private updateSidebarState() {
    if (typeof window === 'undefined') return;
    // On mobile/tablet (less than 1024px), default to collapsed
    // On desktop, default to expanded
    if (window.innerWidth < 1024) {
      this.isSidebarCollapsed = true;
    } else {
      // On desktop, you might want to remember user preference
      // For now, default to expanded
      // this.isSidebarCollapsed = false;
    }
  }

  onToggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}