import { Injectable } from '@angular/core';
import { DBSoloGamesList } from 'src/app/shared/room/solo-room-models';
import { FinishSoloGameMessage, JsonMessageType } from 'src/app/shared/network/json-message';
import { Method } from '../fetch.service';
import { StateService } from './state.service';

const MAX_GAMES = 6;

@Injectable({
  providedIn: 'root'
})
export class SoloGamesListService extends StateService<DBSoloGamesList>() {

  constructor() {
    super([JsonMessageType.FINISH_SOLO_GAME]);
  }

  protected override async fetch(): Promise<DBSoloGamesList> {
    const games = await this.fetchService.fetch<DBSoloGamesList>(Method.GET, "/api/v2/solo-games-list");

    // get the last 6 games
    games.games = games.games.slice(-MAX_GAMES);

    return games;
  }


  protected override onEvent(event: FinishSoloGameMessage, oldState: DBSoloGamesList): DBSoloGamesList {

    if (event.type !== JsonMessageType.FINISH_SOLO_GAME) throw new Error(`Unexpected event type at SoloGamesListService: ${event.type}`);

    const games = oldState.games.slice();

    // Add the game to the end
    games.push({
      id: event.id,
      score: event.score,
      xp: event.xp,
    });

    // Remove the oldest game if there are more than 10
    if (games.length > MAX_GAMES) {
      games.shift();
    }

    return { games };
  }



}
