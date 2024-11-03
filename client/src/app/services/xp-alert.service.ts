import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { JsonMessage, JsonMessageType, XPGainMessage } from '../shared/network/json-message';
import { AlertService } from './alert.service';
import { XPAlertComponent } from '../components/alerts/xp-alert/xp-alert.component';

@Injectable({
  providedIn: 'root'
})
export class XPAlertService {

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly alertService: AlertService,
  ) {

    this.websocketService.onEvent(JsonMessageType.XP_GAIN).subscribe((message: JsonMessage) => {
      const xpGainMessage = message as XPGainMessage;

      // first, add the alert
      this.alertService.addAlert(XPAlertComponent, "xpAlert", {
        league: xpGainMessage.startLeague, startXP: xpGainMessage.startXP, currentXP: xpGainMessage.startXP
      }, 3);

      // then, add the inital xp gain
      setTimeout(() => {
        this.alertService.updateAlert("xpAlert", {currentXP: xpGainMessage.startXP + xpGainMessage.normalXPGain});
      }, 800);



    });

  }
}
