import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tab-selector',
  templateUrl: './tab-selector.component.html',
  styleUrls: ['./tab-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabSelectorComponent {
  @Input() tabs!: string[];
  @Input() selectedTab!: string; // obsolete if linkedToRouter
  @Output() selectedTabChange = new EventEmitter<string>(); // obsolete if linkedToRouter

  @Input() linkedToRouter: boolean = false;
  @Input() tabToURL: {[key in string]: string} = {}; // if linkedToRouter, must be same length as tabs

  constructor() {}

  public selectTab(tab: string): void {

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
