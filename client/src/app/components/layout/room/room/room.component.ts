import { Component, OnDestroy, OnInit } from '@angular/core';
import { RoomService } from 'src/app/services/room/room.service';
import { map } from 'rxjs';
import { RoomType } from 'src/app/shared/room/room-models';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnDestroy {

  constructor(
    public readonly roomService: RoomService,
  ) {}

  // The type of the room
  public roomType$ = this.roomService.getRoomState$().pipe(
    map(roomState => roomState?.type)
  );
  readonly RoomType = RoomType;

  public async sendMessage(message: string) {
    await this.roomService.sendChatMessage(message);
  }

  // Leave the room when the component is destroyed
  async ngOnDestroy() {
    this.roomService.leaveRoom();    
  }

}
