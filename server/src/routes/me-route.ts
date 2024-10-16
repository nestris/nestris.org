import { Authentication, DBUser } from "../../shared/models/db-user";
import { queryUserByUserID } from "../database/user-queries";
import { GetRoute, RouteError, UserInfo } from "./route";


export class MeRoute extends GetRoute<DBUser> {
    route = "/api/v2/me";
    authentication = Authentication.USER;

    async get(userInfo: UserInfo | undefined): Promise<DBUser> {
        
        const me: DBUser | undefined = await queryUserByUserID(userInfo!.userid);
        if (!me) throw new RouteError(404, "User not found");

        return me;
    }
}