import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RoomService } from 'src/app/services/room/room.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { RoomType } from 'src/app/shared/room/room-models';
import { Router } from '@angular/router';
import { PlatformInterfaceService } from 'src/app/services/platform-interface.service';
import { ActiveQuestService } from 'src/app/services/active-quest.service';

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
  public roomType$ = new BehaviorSubject<RoomType | null>(null);

  constructor(
    public readonly roomService: RoomService,
    private readonly platform: PlatformInterfaceService,
    private activeQuestService: ActiveQuestService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // The type of the room
  readonly RoomType = RoomType;

  async ngOnInit() {

    this.gameDataSubscription = this.platform.getGameData$().subscribe(() => this.cdr.detectChanges());

    const roomType = this.roomService.getRoomType();
    this.roomType$.next(roomType);
    console.log('Room type:', roomType);

    // If not in room, redirect to home
    if (!roomType) {
      this.router.navigate(['/']);
    }
  }

  public async sendChatMessage(message: string) {
    await this.roomService.sendChatMessage(message);
  }


  // Leave the room when the component is destroyed
  async ngOnDestroy() {
    await this.roomService.leaveRoom();
    this.gameDataSubscription?.unsubscribe();

    // Reset any active quest
    this.activeQuestService.activeQuestID$.next(null);
  }

}
