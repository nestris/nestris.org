import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepperComponent {

  @Input() activeStep: number = 0;
  @Input() steps!: string[];

}
