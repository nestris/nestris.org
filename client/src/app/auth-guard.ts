import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { WebsocketService } from "./services/websocket.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private websocketService: WebsocketService, private router: Router) {}

  canActivate(): boolean {

    return true; // temporary

    if (this.websocketService.isSignedIn()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}