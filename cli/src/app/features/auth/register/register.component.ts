import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  RegisterRequest,
} from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { OAuthService } from '../../../core/services/oauth.service';

// Custom validator for password confirmation
function passwordMatchValidator(
  control: AbstractControl
): { [key: string]: boolean } | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: [],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private oAuthService: OAuthService
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Component initialization logic if needed
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const registerData: RegisterRequest = {
        name: this.registerForm.value.name,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage =
              'Tài khoản đã được tạo thành công! Đang chuyển hướng...';

            // Redirect to home page after successful registration
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 2000);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Đã xảy ra lỗi không mong muốn';

          // Mark form as touched to show validation errors
          this.registerForm.markAllAsTouched();
        },
      });
    } else {
      // Mark form as touched to show validation errors
      this.registerForm.markAllAsTouched();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async loginWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.oAuthService.loginWithGoogle();
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'Không thể kết nối với Google. Vui lòng thử lại.';
      console.error('Google login error:', error);
    }
  }

  async loginWithGitHub(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.oAuthService.loginWithGitHub();
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = 'Không thể kết nối với GitHub. Vui lòng thử lại.';
      console.error('GitHub login error:', error);
    }
  }

  getInputClasses(fieldName: string): string {
    const baseClasses =
      'appearance-none block w-full pr-10 pl-3 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-colors duration-200 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:text-white';
    const field = this.registerForm.get(fieldName);

    if (field?.invalid && field?.touched) {
      return `${baseClasses} border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500`;
    }

    return `${baseClasses} border-gray-300 dark:border-gray-600 focus:border-blue-500`;
  }

  getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    return strength;
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();

    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getPasswordStrengthTextColor(): string {
    const strength = this.getPasswordStrength();

    if (strength <= 2) return 'text-red-600 dark:text-red-400';
    if (strength <= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();

    if (strength <= 2) return 'Mật khẩu yếu';
    if (strength <= 4) return 'Mật khẩu trung bình';
    return 'Mật khẩu mạnh';
  }
}
