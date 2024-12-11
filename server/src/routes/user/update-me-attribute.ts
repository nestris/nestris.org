import { Authentication, DBUser } from "../../../shared/models/db-user";
import { DBObjectAlterError } from "../../database/db-object-error";
import { DBUpdateAttributeEvent, DBUserObject } from "../../database/db-objects/db-user";
import { PostRoute, RouteError, UserInfo } from "../route";

/**
 * Update the logged in user's DBUser attribute with the given value
 */
export class UpdateMeAttributeRoute extends PostRoute<DBUser> {
    route = "/api/v2/update-attribute";
    authentication = Authentication.USER;

    override async post(userInfo: UserInfo | undefined, pathParams: any, queryParams: any, bodyParams: any): Promise<DBUser> {
        const attribute = bodyParams.attribute;
        const value = bodyParams.value;  
        
        try {
            // Update the user's attribute, which will trigger the MeConsumer to update info for all online sessions
            return await DBUserObject.alter(userInfo!.userid, new DBUpdateAttributeEvent({ attribute, value }), false);

        } catch (error: any) {
            // if the user is not found, return a 404 error
            if (error instanceof DBObjectAlterError) {
                throw new RouteError(404, error.message);
            } else {
                throw new RouteError(500, `Unexpected error: ${error.message}`);
            }
        }
    }
}