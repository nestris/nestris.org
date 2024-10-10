import { ActivePuzzleManager } from "./active-puzzle-manager";
import { ChallengeManager } from "./challenge-manager";
import { LessonState } from "./lesson-state";
import { OnlineUserManager } from "./online-user-manager";
import { PuzzlePrefetchManager } from "./puzzle-prefetch-manager";
import { QueryCache } from "./query-cache";
import { RoomManager } from "./room-manager";

/*
 An aggregation of all the global server state. Server restart will reset this state,
 so use database instead for persistent storage.
*/
export class ServerState {

    public readonly onlineUserManager = new OnlineUserManager(this);
    public readonly roomManager = new RoomManager(this);
    public readonly challengeManager = new ChallengeManager(this);
    public readonly activePuzzleManager = new ActivePuzzleManager(this);
    public readonly puzzlePrefetchManager = new PuzzlePrefetchManager(this);
    public readonly lessonState = new LessonState();
    public readonly cache = new QueryCache();
    public serverRestartWarning: boolean = false;
}