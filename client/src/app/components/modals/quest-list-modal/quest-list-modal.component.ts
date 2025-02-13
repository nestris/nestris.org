import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { MeService } from 'src/app/services/state/me.service';
import { DBUser } from 'src/app/shared/models/db-user';
import { getQuestStatus, QuestDifficulty, QuestID, QUESTS } from 'src/app/shared/nestris-org/quest-system';

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
    public readonly meService: MeService,
  ) {}

  getQuestStatus(me: DBUser, questID: QuestID): number | true {
    const status = getQuestStatus(me.quest_progress, questID)
    return status.completed ? true : status.currentScore;
  }

  

}
