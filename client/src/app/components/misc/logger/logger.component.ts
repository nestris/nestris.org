import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

/*
Useful to include this component for logging observables in HTML templates
Example: <app-logger label="menu" [value]="(platform.getPlatform$() | async)" />
*/

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoggerComponent implements OnChanges {
  @Input() value?: any;
  @Input() label: string = "unknown";

  ngOnChanges(): void {
      console.log(`Detected change for ${this.label}: ${this.value}`);
  }

}
