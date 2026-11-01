import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const host = '0.0.0.0';

app.use(cors());
app.use(express.json());

const SYSTEM_INSTRUCTION = `
You are NOVA, an intelligent task and productivity AI assistant.
When the user asks you to manage tasks or projects (create, update, complete, delete), respond with a helpful, friendly message, and at the VERY END of your response, append an actions block in this EXACT format:

<<<ACTIONS>>>
[
  { "type": "create_task", "title": "Task title", "priority": "normal", "category": "personal" }
]
<<<END>>>

Available Action Types:
- create_task: { "type": "create_task", "title": string, "priority"?: "low"|"normal"|"high", "category"?: "personal"|"work"|"study"|"health"|"shopping"|"other", "dueDate"?: string|null, "projectId"?: string|null }
- update_task: { "type": "update_task", "id": string, "patch": { "title"?: string, "priority"?: "low"|"normal"|"high", "category"?: string, "dueDate"?: string|null } }
- complete_task: { "type": "complete_task", "id": string }
- delete_task: { "type": "delete_task", "id": string }
- create_project: { "type": "create_project", "title": string, "category"?: "personal"|"work"|"study"|"health"|"shopping"|"other" }
- delete_project: { "type": "delete_project", "id": string }

Rules:
1. Always base task IDs on the existing tasks provided in the context.
2. ONLY output the <<<ACTIONS>>> block if there are actual task/project actions to perform.
3. Keep the JSON valid inside the block.
4. Keep advice concise, encouraging, and actionable.
`;

function getMockResponse(prompt: string, context: any) {
  const p = prompt.toLowerCase();
  const tasks = context?.tasks || [];
  const projects = context?.projects || [];

  if (p.includes('plan') && (p.includes('day') || p.includes('today'))) {
    const overdue = tasks.filter((t: any) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
    const pending = tasks.filter((t: any) => !t.completed);
    return `Here is a clear plan for your day:

1. **Top Priority Focus**: Review and finish ${pending.length > 0 ? pending[0].title : 'your most critical pending task'}.
2. **Quick Wins**: Clear 2 smaller items before lunch to build momentum.
3. **Wrap-up**: Take 10 minutes this afternoon to review remaining items and organize tomorrow.

Would you like me to break any of these down into smaller steps?`;
  }

  if (p.includes('organize') || p.includes('priority')) {
    const highTasks = tasks.filter((t: any) => !t.completed && t.priority === 'high');
    return `I looked over your current tasks. You currently have ${tasks.filter((t: any) => !t.completed).length} active items, with ${highTasks.length} set to high priority.

I recommend keeping at most 2-3 items marked High Priority so you can maintain sharp focus. Everything else can be scheduled as Normal or Low priority.`;
  }

  if (p.includes('break down') || p.includes('goal')) {
    return `I can help you break down any goal into actionable steps! Tell me what you would like to achieve (e.g. "Launch a portfolio", "Prep for finals", "Plan a weekend trip") and I'll generate a project with structured subtasks for you.`;
  }

  return `I'm NOVA, your productivity partner. I can help organize your tasks, plan your schedule, break down goals into projects, and suggest priorities. Let me know what you'd like to work on!`;
}

app.post('/api/assistant', async (req, res) => {
  const { messages, context } = req.body;
  const userText = messages?.[messages.length - 1]?.content || 'Hello';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const mockReply = getMockResponse(userText, context);
    return res.json({ text: mockReply });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contextStr = context ? `\n\nCurrent App Context (User Tasks & Projects & Notes):\n${JSON.stringify(context, null, 2)}` : '';
    const fullPrompt = `${SYSTEM_INSTRUCTION}${contextStr}\n\nConversation History:\n${messages.slice(-5).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n\nUser: ${userText}\nAssistant:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    const reply = response.text || 'I have processed your request.';
    return res.json({ text: reply });
  } catch (err: any) {
    console.error('Gemini error:', err);
    const fallback = getMockResponse(userText, context);
    return res.json({ text: fallback });
  }
});

// SSE streaming endpoint
app.post('/api/assistant/stream', async (req, res) => {
  const { messages, context } = req.body;
  const userText = messages?.[messages.length - 1]?.content || 'Hello';
  const apiKey = process.env.GEMINI_API_KEY;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!apiKey) {
    const mockReply = getMockResponse(userText, context);
    // Simulate natural streaming in chunks
    const words = mockReply.split(' ');
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${JSON.stringify({ delta: words[i] + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 25));
    }
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contextStr = context ? `\n\nCurrent App Context:\n${JSON.stringify(context, null, 2)}` : '';
    const fullPrompt = `${SYSTEM_INSTRUCTION}${contextStr}\n\nConversation History:\n${messages.slice(-5).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n\nUser: ${userText}\nAssistant:`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ delta: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Gemini stream error:', err);
    const fallback = getMockResponse(userText, context);
    res.write(`data: ${JSON.stringify({ delta: fallback })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, host, () => {
    console.log(`NOVA server running at http://${host}:${port}`);
  });
}

startServer();
