import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
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
export class QuestComponent implements OnInit {
  @Input() questID!: QuestID; // name of the quest
  @Input() status!: number | true; // if number, is current xp. if true, quest is complete
  @Input() forceHover: boolean = false;

  hovering$ = new BehaviorSubject<boolean>(false);

  ngOnInit(): void {
    this.hovering$.next(this.forceHover);
  }

  setHovering(hovering: boolean) {
    if (this.forceHover) return;
    this.hovering$.next(hovering);
  }

  readonly getQuest = getQuest;
  readonly QUEST_COLORS = QUEST_COLORS;
  readonly QuestDifficulty = QuestDifficulty;
  readonly hexWithAlpha = hexWithAlpha;
  readonly numberWithCommas = numberWithCommas;
  readonly ButtonColor = ButtonColor;

}
