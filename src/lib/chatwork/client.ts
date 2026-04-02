const CHATWORK_API_BASE = "https://api.chatwork.com/v2";

export async function sendMessage(roomId: number, body: string): Promise<void> {
  const res = await fetch(`${CHATWORK_API_BASE}/rooms/${roomId}/messages`, {
    method: "POST",
    headers: {
      "X-ChatWorkToken": process.env.CHATWORK_API_TOKEN!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chatwork API error: ${res.status} ${text}`);
  }
}
