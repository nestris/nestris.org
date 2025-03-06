import { Authentication } from "../../../shared/models/db-user";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { RoomAbortError, RoomConsumer } from "../../online-users/event-consumers/room-consumer";
import { SoloRoom } from "../../room/solo-room";
import { PostRoute, RouteError, UserInfo } from "../route";

/**
 * Route for creating a solo room
 */
export class CreateSoloRoomRoute extends PostRoute {
    route = "/api/v2/create-solo-room/:sessionid";
    authentication = Authentication.USER;

    override async post(userInfo: UserInfo | undefined, pathParams: any) {
        
        const sessionID = pathParams.sessionid as string;

        // Make sure sessionID corresponds to the user
        if (!sessionID) throw new RouteError(400, "Session ID is required");
        if (EventConsumerManager.getInstance().getUsers().getUserIDBySessionID(sessionID) !== userInfo!.userid) {
            throw new RouteError(400, `Session ID ${sessionID} does not correspond to user ${userInfo!.username}`);
        }
        
        // Create a solo room
        try {
            const soloRoom = new SoloRoom({userid: userInfo!.userid, sessionID: sessionID});
            await EventConsumerManager.getInstance().getConsumer(RoomConsumer).createRoom(soloRoom);
        } catch (error: any) {
            if (error instanceof RoomAbortError) {
                throw new RouteError(404, `Unable to create room for ${error.name}: ${error.message}`);
            } else throw error;
        }
        


        return {success: true};
    }
}