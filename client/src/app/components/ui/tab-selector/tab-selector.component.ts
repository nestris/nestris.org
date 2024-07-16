import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tab-selector',
  templateUrl: './tab-selector.component.html',
  styleUrls: ['./tab-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabSelectorComponent {
  @Input() tabs!: any[];
  @Input() selectedTab!: any; // obsolete if linkedToRouter
  @Output() selectedTabChange = new EventEmitter<any>(); // obsolete if linkedToRouter

  @Input() tabStrings?: {[key in any]: string};
  @Input() small: boolean = false;

  @Input() linkedToRouter: boolean = false;
  @Input() tabToURL: {[key in string]: string} = {}; // if linkedToRouter, must be same length as tabs

  constructor() {}

  public selectTab(tab: any): void {

    if (this.selectedTab === tab) {
      return;
    }

    if (!this.tabs.includes(tab)) {
      throw new Error(`Tab ${tab} not found`);
    }

    this.selectedTab = tab;
    this.selectedTabChange.emit(tab);
  }


}
