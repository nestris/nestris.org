import { fetchServer2, Method } from "src/app/scripts/fetch-server"
import { FriendStatusResult } from "src/app/shared/models/friends"


export async function sendFriendRequest(from: string, to: string): Promise<FriendStatusResult> {
  return {
    status: (await fetchServer2<FriendStatusResult>(Method.POST, `/api/v2/friend-request/${from}/${to}`)).status
  }
}

export async function endFriendship(from: string, to: string): Promise<FriendStatusResult> {
  return {
    status: (await fetchServer2<FriendStatusResult>(Method.POST, `/api/v2/end-friendship/${from}/${to}`)).status
  }
}