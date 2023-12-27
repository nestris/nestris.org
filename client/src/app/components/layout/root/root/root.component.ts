import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HomePageComponent } from '../../home/home-page/home-page.component';
import { PlayPageComponent } from '../../play/play-page/play-page.component';
import { SidebarTabService, Tab } from 'client/src/app/services/sidebar-tab.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
})
export class RootComponent {

  readonly Tab = Tab;

  constructor(public sidebarTabService: SidebarTabService) { }

}
