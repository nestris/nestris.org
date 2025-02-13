import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { QUEST_COLORS, QuestID, getQuest, QuestDifficulty, QUESTS } from 'src/app/shared/nestris-org/quest-system';
import { hexWithAlpha, numberWithCommas } from 'src/app/util/misc';
import { ButtonColor } from '../solid-button/solid-button.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-quest',
  templateUrl: './quest.component.html',
  styleUrls: ['./quest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestComponent {
  @Input() questID!: QuestID; // name of the quest
  @Input() status!: number | true; // if number, is current xp. if true, quest is complete

  hovering$ = new BehaviorSubject<boolean>(false);

  readonly getQuest = getQuest;
  readonly QUEST_COLORS = QUEST_COLORS;
  readonly QuestDifficulty = QuestDifficulty;
  readonly hexWithAlpha = hexWithAlpha;
  readonly numberWithCommas = numberWithCommas;
  readonly ButtonColor = ButtonColor;

}
