import type { DifyChatResponse } from "@/lib/api/dify-parse";

export type { DifyChatResponse };

/**
 * ブラウザから Dify を直接叩くと CORS で落ちることが多いため、
 * Next の API Route 経由で呼び出す。
 */
export const sendToDify = async (
  query: string,
  user: string,
  conversationId?: string
) => {
  const response = await fetch("/api/dify/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      user,
      conversationId: conversationId || undefined,
    }),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    let detail = bodyText.slice(0, 300);
    try {
      const err = JSON.parse(bodyText) as { error?: string; message?: string };
      detail = err.error || err.message || detail;
    } catch {
      /* そのまま */
    }
    throw new Error(detail || `Dify proxy failed (${response.status})`);
  }

  return JSON.parse(bodyText) as DifyChatResponse;
};
