import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { capitalize } from 'src/app/util/misc';

@Component({
  selector: 'app-editable-keybind',
  templateUrl: './editable-keybind.component.html',
  styleUrls: ['./editable-keybind.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditableKeybindComponent {
  @Input() keybind!: string;
  @Output() setKeybind = new EventEmitter<boolean>();

  getDisplayKeybind(): string {
    if (this.keybind.startsWith('Arrow')) return capitalize(this.keybind.slice(5).toLowerCase());
    if (this.keybind === ' ') return 'Space';
    if (this.keybind.length === 1) return this.keybind.toUpperCase();
    return capitalize(this.keybind.toLowerCase());
  }

  getFontSize(): number {
    if (this.getDisplayKeybind().length === 1) return 14;
    return 12;
  }

}
