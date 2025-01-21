import { OnlineUserCache } from "./online-user-cache";

export class TestUserCache extends OnlineUserCache<string> {
    protected override async query(userid: string): Promise<string> {
        return `Data for user ${userid}`;
    }
}