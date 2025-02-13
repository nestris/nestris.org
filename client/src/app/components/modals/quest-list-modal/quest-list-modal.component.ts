import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { QuestDifficulty, QUESTS } from 'src/app/shared/nestris-org/quest-system';

@Component({
  selector: 'app-quest-list-modal',
  templateUrl: './quest-list-modal.component.html',
  styleUrls: ['./quest-list-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestListModalComponent {

  readonly QUESTS = QUESTS;
  readonly QuestDifficulty = QuestDifficulty;

  constructor(
    public readonly modalManagerService: ModalManagerService,
  ) {}

  

}
