export interface DifyChatResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  answer: string;
  created_at: number;
}

/** Dify の blocking が JSON 以外（SSE）で返るケースや、ストリーミング本文のフォールバック用 */
export function parseDifyChatSuccessBody(
  raw: string,
  contentType: string
): DifyChatResponse {
  const trimmed = raw.trim();
  const ct = contentType.toLowerCase();

  if (ct.includes("application/json") || trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed) as Partial<DifyChatResponse>;
      if (typeof data.answer === "string") {
        return {
          event: data.event || "message",
          message_id: data.message_id || "",
          conversation_id: data.conversation_id || "",
          answer: data.answer,
          created_at: data.created_at ?? 0,
        };
      }
    } catch {
      /* SSE へ */
    }
  }

  let messageId = "";
  let conversationId = "";
  let mergedAnswer = "";

  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("data:")) continue;
    const payload = t.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const evt = JSON.parse(payload) as {
        event?: string;
        answer?: string;
        message_id?: string;
        id?: string;
        conversation_id?: string;
      };
      if (evt.conversation_id) conversationId = evt.conversation_id;
      if (evt.message_id) messageId = evt.message_id;
      else if (evt.id) messageId = evt.id;

      if (typeof evt.answer !== "string" || !evt.answer) continue;

      const ev = evt.event || "";
      if (
        ev === "message" ||
        ev === "agent_message" ||
        ev === "text_chunk" ||
        ev === "message_end" ||
        ev === ""
      ) {
        if (ev === "agent_message" || ev === "text_chunk") {
          mergedAnswer += evt.answer;
        } else if (ev === "message" || ev === "message_end") {
          if (evt.answer.length >= mergedAnswer.length) {
            mergedAnswer = evt.answer;
          }
        } else {
          mergedAnswer += evt.answer;
        }
      }
    } catch {
      // 無視
    }
  }

  if (!mergedAnswer) {
    throw new Error(
      "Difyの応答を解釈できませんでした（JSONでもSSEでもanswerが見つかりません）。"
    );
  }

  return {
    event: "message",
    message_id: messageId,
    conversation_id: conversationId,
    answer: mergedAnswer,
    created_at: 0,
  };
}
