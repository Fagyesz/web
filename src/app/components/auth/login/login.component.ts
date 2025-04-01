import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password).toPromise();
      this.router.navigate(['/admin/dashboard']);
    } catch (error: any) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  signInWithGoogle(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Starting Google login process...');

    this.authService.signInWithGoogle().subscribe({
      next: (user) => {
        if (user) {
          console.log('Google login successful, user:', user.email);
          // Note: Navigation now happens in the auth service
        } else {
          console.error('Google login returned no user');
          this.errorMessage = 'Google sign-in failed. Please try again.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Google login error:', error);
        this.errorMessage = this.getErrorMessage(error);
        this.isLoading = false;
      }
    });
  }

  private getErrorMessage(error: any): string {
    console.log('Login error details:', error);
    
    if (!error || !error.code) {
      return 'An error occurred during login. Please try again.';
    }
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing the sign-in process.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in popup was cancelled.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by the browser. Please allow popups for this site.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for OAuth operations.';
      case 'auth/operation-not-allowed':
        return 'This login method is not enabled. Please contact the administrator.';
      case 'auth/invalid-credential':
        return 'The authentication credential is invalid. Please try again.';
      default:
        return `Login error: ${error.message || error.code}`;
    }
  }
} 