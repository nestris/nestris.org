import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit, OnChanges {
  @Input() hide: boolean = false;
  @Input() alertID!: string;

  hovered$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly alertService: AlertService 
  ) {}

  ngOnInit() {
    console.log("laert id", this.alertID);
  }

  setHovered(hovered: boolean) {
    this.hovered$.next(hovered);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hide && !this.hovered$.getValue()) this.alertService.fullyDeleteAlert(this.alertID);
  }
}
