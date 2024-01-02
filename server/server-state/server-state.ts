import { OnlineUserManager } from "./online-user-manager";

/*
 An aggregation of all the global server state. Server restart will reset this state,
 so use database instead for persistent storage.
*/
export class ServerState {

    public readonly onlineUserManager = new OnlineUserManager(this);

}