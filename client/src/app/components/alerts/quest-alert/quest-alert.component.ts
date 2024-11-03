import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { QUEST_COLORS, QuestDefinitions } from 'src/app/shared/nestris-org/quest-system';

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
  @Input() hide: boolean = false;
  @Input() name!: string; // name of the quest

  public getQuestColor(name: string) {
    const quest = QuestDefinitions.getQuestDefinition(name);
    return QUEST_COLORS[quest.difficulty];
  }


}
