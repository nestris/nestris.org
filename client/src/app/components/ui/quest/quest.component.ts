import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { QUEST_COLORS, QuestDefinitions } from 'src/app/shared/nestris-org/quest-system';

@Component({
  selector: 'app-quest',
  templateUrl: './quest.component.html',
  styleUrls: ['./quest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestComponent {
  @Input() name!: string; // name of the quest
  @Input() status!: number | true; // if number, is current xp. if true, quest is complete

  readonly QuestDefinitions = QuestDefinitions;
  readonly QUEST_COLORS = QUEST_COLORS;

}
