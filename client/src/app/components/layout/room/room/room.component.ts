import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MeService } from 'src/app/services/state/me.service';
import { RoomService } from 'src/app/services/room/room.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {

  constructor(
    public readonly roomService: RoomService,
    private readonly meService: MeService,
    private readonly route: ActivatedRoute
  ) {}

  async ngOnInit() {

    // Wait for the user to be authenticated
    await this.meService.waitForAuth();

    const params = this.route.snapshot.queryParams;
    
  }

  async ngOnDestroy() {
    
  }

}
