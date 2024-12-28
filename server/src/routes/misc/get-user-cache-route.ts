import { Authentication } from "../../../shared/models/db-user";
import { DBUserObject } from "../../database/db-objects/db-user";
import { GetRoute, UserInfo } from "../route";

/**
 * Clear the in-memory cache of all user objects
 */
export class GetUserCacheRoute extends GetRoute {
    route = "/api/v2/user-cache";

    override async get(userInfo: UserInfo | undefined) {
        return DBUserObject.getAllCacheEntries();
    }
}