import { Authentication, DBUser } from "../../../shared/models/db-user";
import { DBObjectNotFoundError } from "../../database/db-object-error";
import { DBUserObject } from "../../database/db-objects/db-user";
import { GetRoute, RouteError, UserInfo } from "../route";

/**
 * Route for getting the logged in user's information
 */
export class GetMeRoute extends GetRoute<DBUser> {
    route = "/api/v2/me";
    authentication = Authentication.USER;

    override async get(userInfo: UserInfo | undefined): Promise<DBUser> {
        
        try {
            // get the user object from either the in-memory cache or the database
            const {object, cached, ms} = await DBUserObject.get(userInfo!.userid);

            // return DBUser with cached and ms properties
            return Object.assign({}, object, {cached, ms});

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