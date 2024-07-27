import { Component, Input } from '@angular/core';
import { MultiplayerData } from 'src/app/shared/models/multiplayer';

@Component({
  selector: 'app-multiplayer-after-match',
  templateUrl: './multiplayer-after-match.component.html',
  styleUrls: ['./multiplayer-after-match.component.scss']
})
export class MultiplayerAfterMatchComponent {
  @Input() data!: MultiplayerData;
}
