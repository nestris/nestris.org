import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonColor } from '../../ui/solid-button/solid-button.component';

export enum AuthMode {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER'
}

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthModalComponent {

  public username: string = '';
  public password: string = '';

  public authMode: AuthMode = AuthMode.LOGIN;

  readonly ButtonColor = ButtonColor;

  login(): void {
    console.log('Logging in with username:', this.username, 'and password:', this.password);
  }

  toggleAuthMode(): void {
    this.authMode = this.authMode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN;
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
