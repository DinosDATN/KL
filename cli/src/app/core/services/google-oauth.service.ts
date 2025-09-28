import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleOAuthService {
  private googleLoaded = false;
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3000/api/v1';

  constructor() {
    this.loadGoogleScript();
  }

  /**
   * Load Google OAuth script dynamically
   */
  private loadGoogleScript(): void {
    if (typeof document !== 'undefined' && !this.googleLoaded) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.googleLoaded = true;
        console.log('Google OAuth script loaded');
      };
      script.onerror = (error) => {
        console.error('Failed to load Google OAuth script:', error);
      };
      document.head.appendChild(script);
    }
  }

  /**
   * Check if Google OAuth is ready
   */
  private isGoogleReady(): boolean {
    return this.googleLoaded && typeof window !== 'undefined' && window.google;
  }

  /**
   * Wait for Google OAuth to be ready
   */
  private waitForGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isGoogleReady()) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (this.isGoogleReady()) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Google OAuth script failed to load within timeout'));
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Initiate Google OAuth login by redirecting to backend OAuth endpoint
   */
  async loginWithGoogle(): Promise<void> {
    try {
      // Simple redirect approach - let the backend handle OAuth
      const googleAuthUrl = `${this.apiUrl}/auth/google`;
      console.log('Redirecting to Google OAuth:', googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      throw new Error('Failed to start Google authentication');
    }
  }

  /**
   * Alternative method: Use Google's One Tap login (if needed)
   */
  async initializeOneTap(clientId: string): Promise<void> {
    try {
      await this.waitForGoogle();
      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          console.log('Google One Tap response:', response);
          // Handle the credential response here
          this.handleCredentialResponse(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: '100%'
        }
      );

    } catch (error) {
      console.error('Failed to initialize Google One Tap:', error);
      throw error;
    }
  }

  /**
   * Handle Google credential response (for One Tap)
   */
  private handleCredentialResponse(response: any): void {
    // This would send the ID token to your backend for verification
    console.log('Google credential response:', response);
    
    // You could implement this to send the credential to your backend
    // for server-side verification instead of the redirect flow
  }

  /**
   * Prompt One Tap login
   */
  async promptOneTap(): Promise<void> {
    try {
      await this.waitForGoogle();
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('Failed to prompt Google One Tap:', error);
      throw error;
    }
  }
}
