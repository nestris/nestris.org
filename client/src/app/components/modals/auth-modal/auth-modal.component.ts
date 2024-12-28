import { ChangeDetectionStrategy, Component, Host, HostListener } from '@angular/core';
import { ButtonColor } from '../../ui/solid-button/solid-button.component';
import { BehaviorSubject } from 'rxjs';
import { FetchService, HTTPError, Method } from 'src/app/services/fetch.service';
import { Router } from '@angular/router';
import { ModalManagerService } from 'src/app/services/modal-manager.service';

export enum AuthMode {
  LOGIN = 'login',
  REGISTER = 'register'
}

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthModalComponent {
  public authMode: AuthMode = AuthMode.LOGIN;

  public username: string = '';
  public password: string = '';
  public confirmPassword: string = '';

  public error$ = new BehaviorSubject<string | null>(null);
  public usernameValid$ = new BehaviorSubject<boolean>(true);
  public passwordValid$ = new BehaviorSubject<boolean>(true);
  public confirmPasswordValid$ = new BehaviorSubject<boolean>(true);

  readonly ButtonColor = ButtonColor;
  readonly AuthMode = AuthMode;

  constructor(
    private readonly fetchService: FetchService,
  ) {}

  // if enter is pressed, submit the form
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.submit();
    }
  }

  async submit() {
    console.log('Logging in with username:', this.username, 'and password:', this.password);

    this.usernameValid$.next(true);
    this.passwordValid$.next(true);
    this.confirmPasswordValid$.next(true);
    this.error$.next(null);

    if (this.authMode === AuthMode.LOGIN) {

      if (this.username === '' || this.password === '') {
        this.error$.next('Fill in required fields');
        if (this.username === '') this.usernameValid$.next(false);
        if (this.password === '') this.passwordValid$.next(false);
        return;
      }

      const loginError = await this.login();
      if (loginError) {
        this.error$.next(loginError);
        this.usernameValid$.next(false);
        this.passwordValid$.next(false);
        return;
      }

    } else {

      if (this.username === '' || this.password === '' || this.confirmPassword === '') {
        this.error$.next('Fill in required fields');
        if (this.username === '') this.usernameValid$.next(false);
        if (this.password === '') this.passwordValid$.next(false);
        if (this.confirmPassword === '') this.confirmPasswordValid$.next(false);
        return;
      }

      const usernameError = this.validateUsername(this.username);
      if (usernameError) {
        this.error$.next(usernameError);
        this.usernameValid$.next(false);
        return;
      }

      const passwordError = this.validatePassword(this.password);
      if (passwordError) {
        this.error$.next(passwordError);
        this.passwordValid$.next(false);
        return;
      }

      if (this.password !== this.confirmPassword) {
        this.error$.next('Passwords do not match');
        this.passwordValid$.next(false);
        this.confirmPasswordValid$.next(false);
        return;
      }

      const registerError = await this.register();
      if (registerError) {
        this.error$.next(registerError);
        this.usernameValid$.next(false);
        return;
      }

    }
  }

  // Returns error message if login fails, or null if successful
  private async login(): Promise<string | null> {

    try {
      await this.fetchService.fetch(Method.POST, '/api/v2/password-login', {
        username: this.username,
        password: this.password
      });
      console.log('Login successful');

      // Redirect to home page, reload to update user info
      location.href = '/';      
      return null;

    } catch (e) {
      if (!(e instanceof HTTPError) || e.status === 500) return 'Server error occurred';
      else if (e.status === 409) return 'If this is you, log in through Discord instead';
      else if (e.status === 403) return 'Invalid username or password';
      else return e.message;
    }
    
  }

  // Redirects to the home page and returns true if successful, false otherwise
  private async register(): Promise<string | null> {
      try {
        await this.fetchService.fetch(Method.POST, '/api/v2/password-register', {
          username: this.username,
          password: this.password
        });
        console.log('Register successful');

        // Redirect to home page
        location.href = '/';
        return null;
  
      } catch (e) {
        if (!(e instanceof HTTPError) || e.status === 500) return 'Server error occurred';
        else if (e.status === 403) return 'Username already exists';
        else return e.message;
      }
  }

  validateUsername(username: string): string | null {

    // Must be 3-16 characters
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 16) return 'Username must be at most 16 characters';

    // Must be alphanumeric
    if (!/^[a-zA-Z0-9]*$/.test(username)) return 'Username must be alphanumeric';

    return null;
    }


  // Returns null if valid, or an error message if invalid
  validatePassword(password: string): string | null {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  }


  toggleAuthMode(): void {
    this.authMode = this.authMode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN;

    // Reset confirm password field
    this.confirmPassword = '';
  }

  getSwitchModeMessage(): string {
    if (this.authMode === AuthMode.LOGIN) {
      return 'Don\'t have an account? Register!';
    } else {
      return 'Already have an account? Login!';
    }
  }

  getAuthButtonLabel(): string {
    return this.authMode === AuthMode.LOGIN ? 'Login' : 'Register';
  }
}
