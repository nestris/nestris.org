import { TimestampedActivity } from "../../../shared/models/activity";
import { Authentication } from "../../../shared/models/db-user";
import { Database, DBQuery } from "../../database/db-query";
import { EventConsumerManager } from "../../online-users/event-consumer";
import { ActivityConsumer } from "../../online-users/event-consumers/activity-consumer";
import { GetRoute, UserInfo } from "../route";


/**
 * Get all past activities for the logged in user
 */
export class GetAllActivitiesRoute extends GetRoute<TimestampedActivity[]> {
  route = "/api/v2/activities";
  authentication = Authentication.USER;

  override async get(userInfo: UserInfo | undefined): Promise<TimestampedActivity[]> {
    const activityConsumer = EventConsumerManager.getInstance().getConsumer(ActivityConsumer);
    return await activityConsumer.getActivitiesForUser(userInfo!.userid);
  }
}