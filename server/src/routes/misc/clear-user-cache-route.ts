import { Authentication } from "../../../shared/models/db-user";
import { DBUserObject } from "../../database/db-objects/db-user";
import { PostRoute, UserInfo } from "../route";

/**
 * Clear the in-memory cache of all user objects
 */
export class ClearUserCacheRoute extends PostRoute {
    route = "/api/v2/user-cache/clear";
    authentication = Authentication.ADMIN;

    override async post(userInfo: UserInfo | undefined) {
        DBUserObject.clearCache();
        return {success: true};
    }
}