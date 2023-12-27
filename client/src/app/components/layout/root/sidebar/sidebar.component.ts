import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TabID } from 'client/src/app/models/tabs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  readonly TabID = TabID;

}
