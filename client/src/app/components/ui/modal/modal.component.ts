import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements OnInit {
  @Input() visibility$!: BehaviorSubject<boolean>;

  constructor() {
  }

  ngOnInit(): void {
    this.visibility$.subscribe((visibility) => {
      console.log("Modal visibility changed to " + visibility);
    });
  }


}
