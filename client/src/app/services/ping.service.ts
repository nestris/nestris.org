import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { JsonMessageType, PingMessage } from '../shared/network/json-message';


/*
Sends a ping to server frequently to determine latency
*/

export enum PingSpeed {
  FAST = "fast",
  MEDIUM = "medium",
  SLOW = "slow",
}

const PING_SPEED_COLOR_MAP = new Map<PingSpeed, string>([
  [PingSpeed.FAST, "#58D774"],
  [PingSpeed.MEDIUM, "#D79558"],
  [PingSpeed.SLOW, "#D75858"],
]);

const getPingSpeed = (ping: number): PingSpeed => {
  if (ping < 100) {
    return PingSpeed.FAST;
  } else if (ping < 300) {
    return PingSpeed.MEDIUM;
  } else {
    return PingSpeed.SLOW;
  }
}

// immutable struct for ping data
export class PingData {
  constructor(
    public readonly ping: number | undefined = undefined,
    public readonly pingString: string = "-",
    public readonly pingSpeed: PingSpeed = PingSpeed.SLOW,
  ) {}

  get pingColor(): string {
    return PING_SPEED_COLOR_MAP.get(this.pingSpeed)!;
  }
}

/*
  When the user is logged in, send a PingMessage at a specified interval to both check
  if the connection is still alive and to calculate the ping time.
*/
@Injectable({
  providedIn: 'root'
})
export class PingService {

  readonly PING_INTERVAL_SECONDS = 4;

  private pingSubject$ = new BehaviorSubject<PingData>(new PingData());

  constructor(
    private websocketService: WebsocketService
  ) {

    console.log("PingService constructor called");

    // when the user signs in, start sending ping messages ever PING_INTERVAL_SECONDS seconds
    this.websocketService.onSignIn().subscribe(() => {

      // send a ping message immediately
      this.sendPingMessage();

      setInterval(() => {
        this.sendPingMessage();
      }, this.PING_INTERVAL_SECONDS * 1000);
    });

    // On receiving a ping message, calculate the ping time and update the ping observable
    this.websocketService.onEvent(JsonMessageType.PING).subscribe((message) => {
      const ping = Date.now() - (message as PingMessage).ms;
      this.pingSubject$.next(new PingData(
        ping,
        ping.toFixed(0) + " ms",
        getPingSpeed(ping),
      ));
    });
  }

  // observable emits whenever the ping is updated
  onPingUpdate(): Observable<PingData> {
    return this.pingSubject$.asObservable();
  }

  // get the current ping
  getPing(): PingData {
    return this.pingSubject$.getValue();
  }

  private sendPingMessage() {
    if (!this.websocketService.isSignedIn()) return;
    this.websocketService.sendJsonMessage(new PingMessage(Date.now()));
  }

}
