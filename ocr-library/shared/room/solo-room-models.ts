import { RoomState, RoomType } from "./room-models";

export interface SoloGameInfo {
    gameID: string;
    score: number;
    xp: number;
}

export interface SoloRoomState extends RoomState {
    type: RoomType.SOLO;

    // at start of solo room, set to false. When server receives GAME_START packet, set to true. When server
    // receives GAME_END packet and finishes processing it, set to false and set previousGame. Client cannot start new game until
    // serverInGame is false.
    serverInGame: boolean;

    previousGames: SoloGameInfo[];
}