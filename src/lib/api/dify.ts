export interface DifyChatResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  answer: string;
  created_at: number;
}

export const sendToDify = async (
  query: string,
  user: string,
  conversationId?: string
): Promise<DifyChatResponse> => {
  const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY;
  const apiUrl = "https://api.dify.ai/v1"; // URLを直接指定して404を回避

  if (!apiKey) {
    throw new Error("Dify API key is not configured.");
  }

  const response = await fetch(`${apiUrl}/chat-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: {},
      query: query,
      response_mode: "blocking",
      user: user,
      conversation_id: conversationId || "",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to communicate with Dify");
  }

  return response.json();
};
