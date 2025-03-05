import { errorHandler, ErrorLog } from "../../errors/error-handler";
import { GetRoute, UserInfo } from "../route";

/**
 * Get all global stats from the GlobalStatConsumer
 */
export class GetErrorsRoute extends GetRoute<ErrorLog[]> {
    route = "/api/v2/errors";

    override async get(userInfo: UserInfo | undefined): Promise<ErrorLog[]> {
        return errorHandler.getErrors();
    }
}