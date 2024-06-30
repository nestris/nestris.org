import { ChallengeManager } from "./challenge-manager";
import { OnlineUserManager } from "./online-user-manager";
import { RoomManager } from "./room-manager";

/*
 An aggregation of all the global server state. Server restart will reset this state,
 so use database instead for persistent storage.
*/
export class ServerState {

    public readonly onlineUserManager = new OnlineUserManager(this);
    public readonly roomManager = new RoomManager(this);
    public readonly challengeManager = new ChallengeManager(this);

}