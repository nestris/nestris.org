import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { TabID, getTabDisplayName, getTabIcon } from 'client/src/app/models/tabs';

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
export class SidebarTabComponent implements OnChanges {
  @Input() tab!: TabID;

  public tabName!: string;
  public tabIcon!: string;

  constructor() { 
  }

  ngOnChanges(): void {
    this.tabName = getTabDisplayName(this.tab);
    this.tabIcon = getTabIcon(this.tab);
    console.log("SidebarTabComponent ngOnChanges", this.tabName, this.tabIcon);
  }


}
