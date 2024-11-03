import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { JsonMessage, JsonMessageType, XPGainMessage } from '../shared/network/json-message';
import { AlertService } from './alert.service';
import { XPAlertComponent } from '../components/alerts/xp-alert/xp-alert.component';
import { sleep } from '../util/misc';
import { QuestDefinitions } from '../shared/nestris-org/quest-system';
import { QuestAlertComponent } from '../components/alerts/quest-alert/quest-alert.component';

@Injectable({
  providedIn: 'root'
})
export class XPAlertService {

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly alertService: AlertService,
  ) {

    this.websocketService.onEvent(JsonMessageType.XP_GAIN).subscribe((message: JsonMessage) => {
      this.onXPGain(message as XPGainMessage);
    });

  }

  private async onXPGain(message: XPGainMessage) {

    let xp = message.startXP;

    const addXP = (xpGain: number) => {
      xp += xpGain;

      this.alertService.updateAlert("xpAlert", {currentXP: xp});
    }

    // first, add the alert
    this.alertService.addAlert(XPAlertComponent, "xpAlert", {
      league: message.startLeague, currentXP: xp
    });

    // Wait a bit, then update the alert with the new XP
    await sleep(800);
    addXP(message.normalXPGain);


    // For each completed quest, show a quest alert
    for (const quest of message.completedQuests) {

      await sleep(1000);

      // Add the alert for the quest
      this.alertService.addAlert(QuestAlertComponent, quest, {
        name: quest
      });

      await sleep(1000);

      // Add the alert for the XP gain
      const xpGain = QuestDefinitions.getQuestDefinition(quest).xp;
      addXP(xpGain);
    }

    // Hide all alerts after a bit
    await sleep(2500);
    this.alertService.removeAlert("xpAlert");
    for (const quest of message.completedQuests) {
      this.alertService.removeAlert(quest);
    }

  }
}
