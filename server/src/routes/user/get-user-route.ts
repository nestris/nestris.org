import { Authentication, DBUser, DBUserWithOnlineStatus } from "../../../shared/models/db-user";
import { DBObjectNotFoundError } from "../../database/db-object-error";
import { DBUserObject } from "../../database/db-objects/db-user";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { GetRoute, RouteError, UserInfo } from "../route";

/**
 * Route for getting the logged in user's information
 */
export class GetUserRoute extends GetRoute<DBUserWithOnlineStatus> {
    route = "/api/v2/user/:userid";

    override async get(userInfo: UserInfo | undefined, pathParams: any): Promise<DBUserWithOnlineStatus> {
        const userid = pathParams.userid as string;

        const users = EventConsumerManager.getInstance().getUsers();
        
        try {
            // get user from cache/database, and check if online
            return Object.assign({},
                await DBUserObject.get(userid),
                 { online: users.isUserOnline(userid) }
            );

        } catch (error: any) {
            // if the user is not found, return a 404 error
            if (error instanceof DBObjectNotFoundError) {
                throw new RouteError(404, "User not found");
            } else {
                throw new RouteError(500, `Unexpected error: ${error.message}`);
            }
        }
    }
}