import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, OnChanges, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum ButtonColor {
  GREEN = "#54A165",
  RED = "#B73C3C",
  BLUE = "#3C5EB7",
  GREY = "#2F3033",
  DARK = "#151515",
}

@Component({
  selector: 'app-solid-selector',
  templateUrl: './solid-selector.component.html',
  styleUrls: ['./solid-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolidSelectorComponent {
  @Input() labels!: string[];
  @Input() icons?: string[];
  @Input() color: string | ButtonColor = ButtonColor.BLUE;
  @Input() fontSize: number = 16;
  @Input() fontWeight: number = 600;
  @Input() paddingHorizontal: number = 15;
  @Input() paddingVertical: number = 6;
  @Input() width: number = 100;
  @Input() height: number = 30;
  @Input() borderRadius: number = 5;
  @Input() iconWidth?: number;
  @Input() dropdownIconWidth: number = 15;
  @Input() gap: number = 4;
  @Input() textOpacity: number = 1;
  @Input() updateInternally: boolean = true;

  // The selected index for the labels
  @Input() selected: number = 0;
  @Output() selectedChange = new EventEmitter<number>();

  public expanded$ = new BehaviorSubject<boolean>(false);

  clickIndex(event: MouseEvent, index: number) {

    event.stopPropagation();

    if (this.updateInternally) this.selected = index;
    this.selectedChange.emit(index);

    // toggle the expanded state
    this.expanded$.next(!this.expanded$.getValue());
  }

  collapse() {
    if (!this.expanded$.getValue()) return;

    this.expanded$.next(false);
  }

  iterateIndices( expanded: boolean) {

    let indicies = [];
    if (expanded) indicies = [this.selected, ...Array.from(Array(this.labels.length).keys()).filter(i => i !== this.selected)];
    else indicies = [this.selected];

    //returns enumerted array of tuples (index, isFirst, isLast)
    return indicies.map((index, i) => {
      return {
        index: index,
        isFirst: i === 0,
        isLast: i === indicies.length - 1
      };
    });
  }

}
