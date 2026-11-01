import type { ChatMsg } from "./protocol";

interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamAssistant(
  args: {
    sessionId: string;
    messages: { role: "user" | "assistant"; content: string }[];
    context: any;
    signal?: AbortSignal;
  },
  handlers: StreamHandlers,
): Promise<void> {
  try {
    const res = await fetch("/api/assistant/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: args.sessionId,
        messages: args.messages,
        context: args.context,
      }),
      signal: args.signal,
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    if (!res.body) {
      throw new Error("No response body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let pending = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        pending += decoder.decode(value, { stream: true });
        const parts = pending.split("\n\n");
        pending = parts.pop() || "";
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === "[DONE]") {
              handlers.onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.delta) {
                handlers.onDelta(parsed.delta);
              }
            } catch {
              // ignore invalid json chunks
            }
          }
        }
      }
    }
    handlers.onDone();
  } catch (e: any) {
    if (args.signal?.aborted) return;
    console.error("Assistant error:", e);
    handlers.onError(e?.message ? `AI Error: ${e.message}` : "Unable to reach NOVA assistant.");
  }
}

export type { ChatMsg };
