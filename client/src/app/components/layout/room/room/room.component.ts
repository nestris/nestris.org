import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RoomService } from 'src/app/services/room/room.service';
import { BehaviorSubject, map, Subscription } from 'rxjs';
import { RoomType } from 'src/app/shared/room/room-models';
import { Router } from '@angular/router';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';

export enum RoomModal {
  SOLO_BEFORE_GAME = 'SOLO_BEFORE_GAME',
  SOLO_AFTER_GAME = 'SOLO_AFTER_GAME',
  MULTIPLAYER_AFTER_MATCH = 'MULTIPLAYER_AFTER_MATCH',
}

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoomComponent implements OnInit, OnDestroy {

  readonly RoomModal = RoomModal;

  private gameDataSubscription?: Subscription;

  constructor(
    public readonly roomService: RoomService,
    private readonly platform: PlatformInterfaceService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // The type of the room
  public roomType!: RoomType | null;
  readonly RoomType = RoomType;

  async ngOnInit() {

    this.gameDataSubscription = this.platform.getGameData$().subscribe(() => this.cdr.detectChanges());

    this.roomType = this.roomService.getRoomType();

    // If not in room, redirect to home
    if (!this.roomType) {
      this.router.navigate(['/']);
    }
  }

  public async sendChatMessage(message: string) {
    await this.roomService.sendChatMessage(message);
  }


  // Leave the room when the component is destroyed
  async ngOnDestroy() {
    this.roomService.leaveRoom();
    this.gameDataSubscription?.unsubscribe();
  }

}
