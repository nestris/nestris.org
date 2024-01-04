import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractNesLayoutComponent } from '../abstract-nes-layout.component';

@Component({
  selector: 'app-layout-one',
  templateUrl: './layout-one.component.html',
  styleUrls: ['./layout-one.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutOneComponent extends AbstractNesLayoutComponent {

}
