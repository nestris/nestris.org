import { IUserSchema } from "server/database/user/user-schema";
import { Method, fetchServer } from "./fetch-server";

// fetch user info from server by username
export async function getUserInfoFromServer(username: string): Promise<IUserSchema | undefined> {
    const {status, content} = await fetchServer(Method.GET, `/api/user/${username}`);
    if (status === 200) {
        return content as IUserSchema;
    } else {
        return undefined;
    }
    
}