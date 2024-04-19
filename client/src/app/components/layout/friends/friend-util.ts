import { Method, fetchServer2 } from "client/src/app/scripts/fetch-server";
import { FriendStatusResult } from "network-protocol/models/friends";

export async function sendFriendRequest(from: string, to: string): Promise<FriendStatusResult> {
  const response = await fetch(`/api/v2/friend-request/${from}/${to}`, {
    method: 'POST',
  });
  return {
    status: (await fetchServer2<FriendStatusResult>(Method.POST, `/api/v2/friend-request/${from}/${to}`)).status
  }
}

export async function endFriendship(from: string, to: string): Promise<FriendStatusResult> {
  return {
    status: (await fetchServer2<FriendStatusResult>(Method.POST, `/api/v2/end-friendship/${from}/${to}`)).status
  }
}