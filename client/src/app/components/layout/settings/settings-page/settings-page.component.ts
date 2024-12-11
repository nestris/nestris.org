import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MeService } from 'src/app/services/state/me.service';


abstract class Setting {
  public abstract readonly key: string;
}

class Category {
  constructor(
    public readonly name: string,
    public readonly settings: Setting[],
  ) {}
}

class Tab {
  constructor(
    public readonly name: string,
    public readonly categories: Category[],
  ) {}
}

class BooleanSetting extends Setting {
  constructor(
    public readonly key: string,
    public readonly label: string,
  ) { super() }
}


@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss']
})
export class SettingsPageComponent {

  isBooleanSetting = (setting: Setting) => (setting instanceof BooleanSetting) ? (setting as BooleanSetting) : null;

  readonly tabs: Tab[] = [
    new Tab('General', [
      new Category('Friends', [
        new BooleanSetting('enable_receive_friend_requests', 'Allow people to send me friend requests'),
        new BooleanSetting('notify_on_friend_online', 'Notify me when friends go online'),
      ]),
    ])
  ]

  public me$ = this.meService.get$();
  public currentTab$ = new BehaviorSubject<Tab>(this.tabs[0]);

  constructor(
    private meService: MeService,
  ) {}

}
