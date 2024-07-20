import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { TabID, getTabDisplayName, getTabIcon, getTabBadgeIcon } from 'src/app/models/tabs';
import { BadgeService } from 'src/app/services/badge.service';

/*
A dumb component that takes in a Tab enum, an optional <ng-content> element for icons
on the right of the tab, and when tab is clicked it sets the tab in the sidebar tab service.
*/

@Component({
  selector: 'app-sidebar-tab',
  templateUrl: './sidebar-tab.component.html',
  styleUrls: ['./sidebar-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarTabComponent {
  @Input() tab!: TabID;
  @Input() orange: boolean = false;


  constructor(public badgeService: BadgeService) {}

  public getDisplayName = getTabDisplayName;
  public getIcon = getTabIcon;
  public getBadgeIcon = getTabBadgeIcon;

  onTabClick(): void {
    
    // clear any badge when tab is clicked
    this.badgeService.setBadgeInactive(this.tab);

  }


}
