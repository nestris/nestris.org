import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-google-signin',
  templateUrl: './google-signin.component.html',
  styleUrls: ['./google-signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoogleSigninComponent {

  click() {
    console.log("Google Signin clicked");
  }

}
