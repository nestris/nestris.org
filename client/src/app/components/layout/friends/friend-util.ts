export async function sendFriendRequest(from: string, to: string): Promise<"outgoing" | "friends"> {
  const response = await fetch(`/api/v2/friend-request/${from}/${to}`, {
    method: 'POST',
  });
  return response.json();
}

export async function endFriendship(from: string, to: string): Promise<void> {
  const response = await fetch(`/api/v2/end-friendship/${from}/${to}`, {
    method: 'POST',
  });
  return response.json();
}