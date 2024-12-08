import { Injectable } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType, NotificationAutohide } from '../shared/models/notifications';

/*
A wrapper to angular-notifier library to support the following:
- disable autohide
- hide after a certain duration
- wrap notification type into an enum
*/


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private notifier: NotifierService,
  ) {}

  // send a notification to the user
  // type is one of 'info', 'success', 'warning', 'error'
  // message is the message to display
  // id is a unique identifier for this notification
  // durationSeconds is the number of seconds to display the notification for, or undefined for no hide
  notify(type: NotificationType, message: string, autohide: NotificationAutohide = NotificationAutohide.SHORT) {

    // Don't show notifications if the tab is hidden
    if (document.hidden) return;

    const id = uuidv4();

    // angular-notifier is broken and needs a setTimeout to register change detection
    setTimeout(() => {
      this.notifier.notify(type, message, id);
    }, 0);

    // console.log("show:", message, id);

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
        // console.log("hide:", message, id);
      }, durationSeconds * 1000);
    }
    
    return id;
  }

  // hide a notification
  hide(id: string) {
    this.notifier.hide(id);
  }
}
