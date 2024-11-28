import { RoomState, RoomType } from "./room-models";

export interface SoloGameInfo {
    gameID: string;
    score: number;
    xp: number;
}

export interface GameSummary {
    gameID: string;
    score: number;
    isPersonalBest: boolean;
    linesCleared: number;
    tetrisCount: number;
    accuracy: number | null;

}

export interface SoloRoomState extends RoomState {
    type: RoomType.SOLO;

    // at start of solo room, set to false. When server receives GAME_START packet, set to true. When server
    // receives GAME_END packet and finishes processing it, set to false and set previousGame. Client cannot start new game until
    // serverInGame is false.
    serverInGame: boolean;

    previousGames: SoloGameInfo[];
    lastGameSummary: GameSummary | null;
}