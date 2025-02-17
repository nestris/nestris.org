import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { getQuest, QUEST_COLORS, QuestID } from 'src/app/shared/nestris-org/quest-system';

/**
 * Alert for when a quest has been completed
 */

@Component({
  selector: 'app-quest-alert',
  templateUrl: './quest-alert.component.html',
  styleUrls: ['./quest-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestAlertComponent {
  @Input() alertID!: string;
  @Input() hide: boolean = false;
  @Input() questID!: QuestID; // name of the quest

  public getQuestColor(questID: QuestID) {
    const quest = getQuest(questID);
    return QUEST_COLORS[quest.difficulty];
  }


}
