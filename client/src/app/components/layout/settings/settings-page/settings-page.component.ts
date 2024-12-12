import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { MeService } from 'src/app/services/state/me.service';
import { capitalize } from 'src/app/util/misc';


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

class KeybindSetting extends Setting {
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
  isKeybindSetting = (setting: Setting) => (setting instanceof KeybindSetting) ? (setting as KeybindSetting) : null;

  readonly tabs: Tab[] = [
    new Tab('General', [
      new Category('Friends', [
        new BooleanSetting('enable_receive_friend_requests', 'Allow people to send me friend requests'),
        new BooleanSetting('notify_on_friend_online', 'Notify me when friends go online'),
      ]),
      new Category('Emulator Keybinds', [
        new KeybindSetting('keybind_emu_move_left', 'Move Left'),
        new KeybindSetting('keybind_emu_move_right', 'Move Right'),
        new KeybindSetting('keybind_emu_rot_left', 'Rotate Left'),
        new KeybindSetting('keybind_emu_rot_right', 'Rotate Right'),
      ]),
    ])
  ]

  public me$ = this.meService.get$();
  public currentTab$ = new BehaviorSubject<Tab>(this.tabs[0]);

  constructor(
    private meService: MeService,
    private fetchService: FetchService
  ) {}

  getAttribute(user: any, key: string) {
    if (user[key] === undefined) throw new Error(`User does not have attribute ${key}`);
    return user[key];
  }

  async setAttribute(user: any, attribute: string, value: any) {
    if (user[attribute] === undefined) throw new Error(`User does not have attribute ${attribute}`);
    console.log(`Setting ${attribute} to ${value}`);

    await this.fetchService.fetch(Method.POST, "/api/v2/update-attribute", { attribute, value });
  }

}
