import { NextRequest, NextResponse } from "next/server";
import { parseDifyChatSuccessBody } from "@/lib/api/dify-parse";

const defaultApiBase = "https://api.dify.ai/v1";

export async function POST(req: NextRequest) {
  const apiKey =
    process.env.DIFY_API_KEY ?? process.env.NEXT_PUBLIC_DIFY_API_KEY;
  const apiBase =
    process.env.DIFY_API_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_DIFY_API_URL?.replace(/\/$/, "") ??
    defaultApiBase;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Dify API key is not configured (set DIFY_API_KEY or NEXT_PUBLIC_DIFY_API_KEY)." },
      { status: 500 }
    );
  }

  let body: { query?: string; user?: string; conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { query, user, conversationId } = body;
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  if (!user || typeof user !== "string") {
    return NextResponse.json({ error: "user is required" }, { status: 400 });
  }

  const upstream = await fetch(`${apiBase}/chat-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: "blocking",
      user,
      conversation_id: conversationId || "",
    }),
  });

  const raw = await upstream.text();
  const contentType = upstream.headers.get("content-type") || "";

  if (!upstream.ok) {
    let message = raw.slice(0, 500);
    try {
      const err = JSON.parse(raw) as { message?: string };
      if (err.message) message = err.message;
    } catch {
      /* そのまま */
    }
    return NextResponse.json(
      { error: message || `Dify HTTP ${upstream.status}` },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }

  try {
    const data = parseDifyChatSuccessBody(raw, contentType);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to parse Dify response" },
      { status: 502 }
    );
  }
}
