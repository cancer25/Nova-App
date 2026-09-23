import { GoogleGenAI } from "@google/genai";
import type { ChatMsg } from "./protocol";

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  "AQ.Ab8RN6IHsA1suleiql1c22_oALfgjCDC3NN_tc-JugKiB9Banw";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

const SYSTEM_INSTRUCTION = `
You are NOVA, an intelligent task and productivity AI assistant.
When the user asks you to manage tasks or projects (create, update, complete, delete), respond with a helpful message, and at the VERY END of your response, append an actions block in this EXACT format:

<<<ACTIONS>>>
[
  { "type": "create_task", "title": "Task title", "priority": "normal", "category": "personal" }
]
<<<END>>>

Available Action Types:
- create_task: { "type": "create_task", "title": string, "priority"?: "low"|"normal"|"high"|"urgent", "category"?: string, "dueDate"?: string|null, "projectId"?: string|null }
- update_task: { "type": "update_task", "id": string, "patch": { "title"?: string, "priority"?: string, "category"?: string, "dueDate"?: string|null } }
- complete_task: { "type": "complete_task", "id": string }
- delete_task: { "type": "delete_task", "id": string }
- create_project: { "type": "create_project", "title": string, "category"?: string }
- delete_project: { "type": "delete_project", "id": string }

Rules:
1. Always base task IDs on the existing tasks provided in the context.
2. ONLY output the <<<ACTIONS>>> block if there are actual task/project actions to perform.
3. Keep the JSON valid inside the block.
`;

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
    const contextStr = args.context
      ? `\n\nCurrent App Context (User Tasks & Data):\n${JSON.stringify(args.context)}`
      : "";

    const userPrompt = `${SYSTEM_INSTRUCTION}${contextStr}\n\nUser Message: ${
      args.messages[args.messages.length - 1]?.content || "Hello"
    }`;

    // Official Google GenAI Interactions API call
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: userPrompt,
    });

    const replyText = interaction.output_text || "No response generated.";

    handlers.onDelta(replyText);
    handlers.onDone();
  } catch (e: any) {
    console.error("Gemini SDK Error:", e);
    handlers.onError(`AI Error: ${e?.message || "Service unavailable"}`);
  }
}

export type { ChatMsg };
