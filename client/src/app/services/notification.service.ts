import { Injectable } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { v4 as uuidv4 } from 'uuid';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationAutohide {
  DISABLED = 'disabled',
  SHORT = 'short',
  LONG = 'long',
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private notifier: NotifierService) { }

  // send a notification to the user
  // type is one of 'info', 'success', 'warning', 'error'
  // message is the message to display
  // id is a unique identifier for this notification
  // durationSeconds is the number of seconds to display the notification for, or undefined for no hide
  notify(type: NotificationType, message: string, autohide: NotificationAutohide = NotificationAutohide.SHORT) {

    const id = uuidv4();
    this.notifier.notify(type, message, id);
    console.log("show:", message, id);

    let durationSeconds;
    switch (autohide) {
      case NotificationAutohide.DISABLED: return;
      case NotificationAutohide.SHORT: durationSeconds = 4; break;
      case NotificationAutohide.LONG: durationSeconds = 15; break;
    }

    // hide after duration, or no hide if undefined
    if (durationSeconds !== null) {
      setTimeout(() => {
        this.notifier.hide(id!);
        console.log("hide:", message, id);
      }, durationSeconds * 1000);
    }
    
  }
}
