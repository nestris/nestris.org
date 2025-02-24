import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QuestID } from '../shared/nestris-org/quest-system';
import { QuestAlertComponent } from '../components/alerts/quest-alert/quest-alert.component';
import { QuestCompleteMessage, JsonMessageType } from '../shared/network/json-message';
import { AlertService } from './alert.service';
import { WebsocketService } from './websocket.service';
import { MeService } from './state/me.service';
import { ClientRoom } from './room/client-room';
import { MultiplayerClientRoom } from './room/multiplayer-client-room';

const QUEST_ALERT_DURATION = 4;

@Injectable({
  providedIn: 'root'
})
export class QuestService {

  private inGame: boolean = false;
  private delayedCompletedQuests: QuestID[] = [];

  public activeQuestID$ = new BehaviorSubject<QuestID | null>(null);

  private clientRoom?: ClientRoom;

  constructor(
    private readonly websocket: WebsocketService,
    private readonly alertService: AlertService,
    private readonly meService: MeService,
  ) {

    this.websocket.onEvent<QuestCompleteMessage>(JsonMessageType.QUEST_COMPLETE).subscribe((message) => {

      // If disable_midgame_quests setting flag is enabled OR in multiplayer room, queue the quests until game end
      if (this.inGame && (this.meService.getSync()?.disable_midgame_quests || this.clientRoom instanceof MultiplayerClientRoom)) {
        this.delayedCompletedQuests.push(message.questID);
      } else {
        this.alertQuestComplete(message.questID);
      }
    });

  }

  setInGame(inGame: boolean, clientRoom?: ClientRoom) {
    this.inGame = inGame;
    this.clientRoom = clientRoom;

    // When game finished, alert any quests that were queued
    if (!this.inGame) {
      for (let questID of this.delayedCompletedQuests) this.alertQuestComplete(questID);
      this.delayedCompletedQuests = [];
    }
  }

  private alertQuestComplete(questID: QuestID) {
    this.alertService.addAlert(QuestAlertComponent, `quest-${questID}`, {questID: questID}, QUEST_ALERT_DURATION);
  }

}
