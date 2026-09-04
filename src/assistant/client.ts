import type { ChatMsg } from "./protocol";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Streams `/api/assistant/chat` from the backend. Uses SSE-style
 * `data: {json}\n\n` chunks. Works on web (fetch + ReadableStream) and
 * modern React Native (fetch stream body).
 */
export async function streamAssistant(
  args: {
    sessionId: string;
    messages: { role: "user" | "assistant"; content: string }[];
    context: any;
    signal?: AbortSignal;
  },
  handlers: StreamHandlers,
): Promise<void> {
  if (!BASE_URL) {
    handlers.onError("Backend URL is not configured.");
    return;
  }
  const url = `${BASE_URL}/api/assistant/chat`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        session_id: args.sessionId,
        messages: args.messages,
        context: args.context,
      }),
      signal: args.signal,
    });
  } catch (e: any) {
    handlers.onError(
      e?.message?.includes("Aborted") ? "" : "Couldn't reach the AI service. Check your connection.",
    );
    return;
  }

  if (!response.ok) {
    handlers.onError(`AI service unavailable (${response.status}).`);
    return;
  }

  const body = (response as any).body;
  if (!body || typeof body.getReader !== "function") {
    // Fallback: some environments don't expose the stream — read as text.
    try {
      const text = await response.text();
      processSSEBuffer(text, handlers);
      handlers.onDone();
    } catch (e: any) {
      handlers.onError(e?.message ?? "Streaming not supported here.");
    }
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  let ended = false;
  try {
    while (!ended) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const obj = JSON.parse(payload);
          if (obj.delta) handlers.onDelta(String(obj.delta));
          if (obj.error) {
            handlers.onError(String(obj.error));
            ended = true;
            break;
          }
          if (obj.done) {
            handlers.onDone();
            ended = true;
            break;
          }
        } catch {
          // Ignore unparseable lines mid-stream
        }
      }
    }
    if (!ended) handlers.onDone();
  } catch (e: any) {
    if (e?.name !== "AbortError") {
      handlers.onError(e?.message ?? "Streaming failed.");
    }
  }
}

function processSSEBuffer(text: string, handlers: StreamHandlers) {
  const parts = text.split("\n\n");
  for (const part of parts) {
    const line = part.trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    try {
      const obj = JSON.parse(payload);
      if (obj.delta) handlers.onDelta(String(obj.delta));
      if (obj.error) handlers.onError(String(obj.error));
    } catch {}
  }
}

// Re-exported so callers don't need a separate import chain
export type { ChatMsg };
