import { Injectable } from '@angular/core';
import { FetchService, Method } from './fetch.service';
import { DBGame } from '../shared/models/db-game';
import { SortOrder } from '../shared/models/query';
import { MeService } from './state/me.service';
import { DBUser } from '../shared/models/db-user';

export enum GameSortKey {
  TIME = 'created_at',
  SCORE = 'end_score',
  ACCURACY = 'accuracy',
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private readonly fetchService: FetchService,
    private readonly meService: MeService
  ) {}

  private decodeGame(game: DBGame): DBGame {
    return {
      ...game,
      created_at: new Date(game.created_at),
      tetris_rate: game.tetris_rate / 100,
      accuracy: game.accuracy / 100,
    };
  }

  /**
   * Get a list of games for a user sorted by the given parameters
   * @param userid The user id to get games for. If not provided, defaults to the logged in user
   * @param sortKey The key to sort by
   * @param sortOrder The order to sort by
   * @param limit The maximum number of games to return
   * @returns A list of game information, not including the game data
   */
  public async getGamesForUser(
    userid: string | undefined = undefined,
    sortKey: GameSortKey = GameSortKey.TIME,
    sortOrder: SortOrder = SortOrder.DESCENDING,
    limit: number = 100
  ) {

    if (!userid) userid = await this.meService.getUserID();
    if (!userid) throw new Error('User is not logged in');

    const startTime = Date.now();
    const rawGames = await this.fetchService.fetch<DBGame[]>(Method.GET, `/api/v2/games/${userid}/${sortKey}/${sortOrder}/${limit}`);
    console.log(`Got games for user ${userid} sorted by ${sortKey} ${sortOrder} limit ${limit} in ${Date.now() - startTime}ms`);

    return rawGames.map(game => this.decodeGame(game));
  }

  /**
   * Get a game by its id
   * @param gameID The game id
   * @param sessionID The session id
   * @returns The game information
   */
  public async getGame(gameID: string, sessionID: string): Promise<DBGame> {
    const game = await this.fetchService.fetch<DBGame>(Method.POST, `/api/v2/game/${gameID}/${sessionID}`);
    return this.decodeGame(game);
  }

  public async getUserByID(userid: string): Promise<DBUser> {
    const dbUser = await this.fetchService.fetch<DBUser>(Method.GET, `/api/v2/user/${userid}`);
    dbUser.created_at = new Date(dbUser.created_at);
    dbUser.last_online = new Date(dbUser.last_online);
    return dbUser;
  }

}
