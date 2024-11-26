import { Authentication } from "../../../shared/models/db-user";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { FriendEventConsumer } from "../../online-users/event-consumers/friend-event-consumer";
import { PostRoute, UserInfo } from "../route";

/**
 * Route for removing a friend.
 */
export class RemoveFriendRoute extends PostRoute {
  route = "/api/v2/remove-friend/:userid";
  authentication = Authentication.USER;

  override async post(userInfo: UserInfo | undefined, pathParams: any) {

    const myID = userInfo!.userid;
    const otherID = pathParams.userid as string;
      
    // Remove friendship between logged in user and specified userid
    const friendConsumer = EventConsumerManager.getInstance().getConsumer(FriendEventConsumer);
    await friendConsumer.removeFriend(myID, otherID);

    return {success: true};
  }
}