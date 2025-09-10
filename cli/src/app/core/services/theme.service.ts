import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private themeSubject = new BehaviorSubject<Theme>('light');
  
  public theme$ = this.themeSubject.asObservable();
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeTheme();
  }
  
  private initializeTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check for saved theme preference or default to system preference
      const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
      
      if (savedTheme) {
        this.setTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light');
      }
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!localStorage.getItem(this.THEME_KEY)) {
            this.setTheme(e.matches ? 'dark' : 'light');
          }
        });
    }
  }
  
  public setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    
    if (isPlatformBrowser(this.platformId)) {
      // Save to localStorage
      localStorage.setItem(this.THEME_KEY, theme);
      
      // Apply theme to document
      const html = document.documentElement;
      if (theme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }
  
  public toggleTheme(): void {
    const currentTheme = this.themeSubject.value;
    this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }
  
  public getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }
  
  public isDarkMode(): boolean {
    return this.themeSubject.value === 'dark';
  }
  
  public clearThemePreference(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.THEME_KEY);
      // Reset to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }
}
