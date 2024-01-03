import { IUserSchema } from "server/database/user/user-schema";
import { Method, fetchServer } from "./fetch-server";
import { FriendInfo } from "network-protocol/models/friends";

// fetch user info from server by username
export async function getUserInfoFromServer(username: string): Promise<IUserSchema | undefined> {
    const {status, content} = await fetchServer(Method.GET, `/api/user/${username}`);
    if (status === 200) {
        return content as IUserSchema;
    } else {
        return undefined;
    }   
}

// fetch user info from server by username
export async function getFriendInfoFromServer(username: string): Promise<FriendInfo[] | undefined> {
    const {status, content} = await fetchServer(Method.GET, `/api/friends/${username}`);
    if (status === 200) {
        return content as FriendInfo[];
    } else {
        return undefined;
    }   
}