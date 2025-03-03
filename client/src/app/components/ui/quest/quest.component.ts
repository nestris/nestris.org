import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { QUEST_COLORS, QuestID, getQuest, QuestDifficulty, QUESTS, CATEGORY_REDIRECT, QuestRedirect } from 'src/app/shared/nestris-org/quest-system';
import { hexWithAlpha, numberWithCommas } from 'src/app/util/misc';
import { ButtonColor } from '../solid-button/solid-button.component';
import { BehaviorSubject } from 'rxjs';
import { FetchService, Method } from 'src/app/services/fetch.service';
import { WebsocketService } from 'src/app/services/websocket.service';
import { QuestService } from 'src/app/services/quest.service';
import { ModalManagerService } from 'src/app/services/modal-manager.service';
import { RankedQueueService } from 'src/app/services/room/ranked-queue.service';
import { Router } from '@angular/router';
import { PlayService } from 'src/app/services/play.service';

@Component({
  selector: 'app-quest',
  templateUrl: './quest.component.html',
  styleUrls: ['./quest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestComponent implements OnInit {
  @Input() questID?: QuestID; // name of the quest. If not defined, show empty placeholder
  @Input() status!: number | true; // if number, is current xp. if true, quest is complete
  @Input() forceHover: boolean = false;

  readonly getQuest = getQuest;
  readonly QUEST_COLORS = QUEST_COLORS;
  readonly QuestDifficulty = QuestDifficulty;
  readonly hexWithAlpha = hexWithAlpha;
  readonly numberWithCommas = numberWithCommas;
  readonly ButtonColor = ButtonColor;

  hovering$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly activeQuestService: QuestService,
    private readonly modalManagerService: ModalManagerService,
    private readonly playService: PlayService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.hovering$.next(this.forceHover);
  }

  setHovering(hovering: boolean) {
    if (this.forceHover) return;
    this.hovering$.next(hovering);
  }

  // Go to quest
  async go() {

    // Hide quest list modal, if applicable
    this.modalManagerService.hideModal();

    // Update active quest to this one
    this.activeQuestService.activeQuestID$.next(this.questID!);

    // Redirect based on quest category
    const redirect = CATEGORY_REDIRECT[getQuest(this.questID!).category];
    switch (redirect) {
      case QuestRedirect.SOLO:
      case QuestRedirect.SOLO_ACCURACY:
        this.playService.playSolo();
        return;
      case QuestRedirect.RANKED:
        await this.playService.playRanked();
        return;
      case QuestRedirect.PUZZLES:
        this.playService.playPuzzles();
        return;
      case QuestRedirect.FRIENDS:
        this.router.navigate(['/friends']);
    }
  }

}
