import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { capitalize } from 'src/app/util/misc';

export function getDisplayKeybind(keybind: string | null): string {
  if (!keybind) return 'None';
  if (keybind.startsWith('Arrow')) return capitalize(keybind.slice(5).toLowerCase());
  if (keybind === ' ') return 'Space';
  if (keybind.length === 1) return keybind.toUpperCase();
  if (keybind.startsWith('Gamepad')) keybind = keybind.slice(7);
  return capitalize(keybind.toLowerCase());
}

@Component({
  selector: 'app-editable-keybind',
  templateUrl: './editable-keybind.component.html',
  styleUrls: ['./editable-keybind.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditableKeybindComponent {
  @Input() keybind!: string;

  getDisplayKeybind(): string {
    return getDisplayKeybind(this.keybind);
  }

  getFontSize(): number {
    if (this.getDisplayKeybind().length === 1) return 14;
    return 12;
  }

}
