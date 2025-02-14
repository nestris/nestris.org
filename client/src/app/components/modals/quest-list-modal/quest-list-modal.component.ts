import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { MeService } from 'src/app/services/state/me.service';
import { DBUser } from 'src/app/shared/models/db-user';
import { getQuestStatus, QuestDifficulty, QuestID, QUESTS } from 'src/app/shared/nestris-org/quest-system';

const questDifficultyOrder = [QuestDifficulty.EASY, QuestDifficulty.INTERMEDIATE, QuestDifficulty.ADVANCED, QuestDifficulty.EXPERT, QuestDifficulty.IMPOSSIBLE];

// Sort quest IDs first by difficulty, then by xp
const QuestIDs = Object.values(QuestID).filter(id => typeof id === 'number') as QuestID[];
QuestIDs.sort((a, b) => {
  const questA = QUESTS[a];
  const questB = QUESTS[b];
  if (questA.difficulty === questB.difficulty) return questA.xp - questB.xp;
  return questDifficultyOrder.indexOf(questA.difficulty) - questDifficultyOrder.indexOf(questB.difficulty);
});

@Component({
  selector: 'app-quest-list-modal',
  templateUrl: './quest-list-modal.component.html',
  styleUrls: ['./quest-list-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestListModalComponent {

  readonly QuestIDs = QuestIDs;
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
