import { ChangeDetectionStrategy, Component } from '@angular/core';

/*
Use cases for visual x to close some modal or something
Grey by default; red when hovered
*/

@Component({
  selector: 'app-x',
  templateUrl: './x.component.html',
  styleUrls: ['./x.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XComponent {

}
