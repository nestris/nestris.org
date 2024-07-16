import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TooltipService } from 'src/app/services/tooltip.service';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent {

  constructor(public tooltip: TooltipService) {}

}
