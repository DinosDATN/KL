import { Inject, PLATFORM_ID, Directive } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Base class for admin components
 * Handles common functionality like:
 * - SSR detection and prevention of API calls during SSR
 * - Admin access verification
 */
@Directive()
export abstract class BaseAdminComponent {
  protected isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) protected platformId: Object,
    protected authService: AuthService,
    protected router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Check if user has admin access
   * Redirects to home if not admin
   */
  protected checkAdminAccess(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const user = this.authService.getCurrentUser();
    console.log('🔍 Checking admin access:', {
      user: user,
      role: user?.role,
      isAuthenticated: this.authService.isAuthenticated()
    });
    
    if (!user || user.role !== 'admin') {
      console.warn('⚠️ Access denied: User is not admin');
      this.router.navigate(['/']);
      return false;
    }
    
    console.log('✅ Admin access granted');
    return true;
  }

  /**
   * Execute callback only in browser (not during SSR)
   */
  protected runInBrowser(callback: () => void): void {
    if (this.isBrowser) {
      callback();
    }
  }
}
