import type { Task, Project, Note, Category, Priority } from "@/src/store/types";

export type AssistantRole = "user" | "assistant";

export interface ChatMsg {
  id: string;
  role: AssistantRole;
  content: string;
  actions?: AssistantAction[];
  actionsApplied?: boolean;
  actionsDiscarded?: boolean;
  createdAt: string;
  error?: boolean;
}

export type AssistantAction =
  | {
      type: "create_task";
      title: string;
      priority?: Priority;
      category?: Category;
      dueDate?: string | null;
      projectId?: string | null;
    }
  | {
      type: "update_task";
      id: string;
      patch: {
        title?: string;
        priority?: Priority;
        category?: Category;
        dueDate?: string | null;
      };
    }
  | { type: "complete_task"; id: string }
  | { type: "delete_task"; id: string }
  | { type: "create_project"; title: string; category?: Category }
  | { type: "delete_project"; id: string };

const ACTIONS_START = "<<<ACTIONS>>>";
const ACTIONS_END = "<<<END>>>";

/**
 * Extract the JSON actions block appended by the model, if any.
 * Returns cleaned prose (with the block removed) and parsed actions.
 */
export function extractActions(raw: string): { text: string; actions: AssistantAction[] } {
  const startIdx = raw.indexOf(ACTIONS_START);
  if (startIdx === -1) return { text: raw.trim(), actions: [] };
  const endIdx = raw.indexOf(ACTIONS_END, startIdx);
  const jsonPart = raw
    .slice(startIdx + ACTIONS_START.length, endIdx === -1 ? undefined : endIdx)
    .trim();
  const before = raw.slice(0, startIdx).trim();

  let actions: AssistantAction[] = [];
  try {
    const parsed = JSON.parse(jsonPart);
    if (Array.isArray(parsed)) actions = parsed as AssistantAction[];
  } catch {
    // If parsing fails mid-stream, treat as no actions yet
    actions = [];
  }
  return { text: before, actions };
}

export function buildContext(
  tasks: Task[],
  projects: Project[],
  notes: Note[],
  userName: string,
) {
  return {
    user_name: userName || "Friend",
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      category: t.category,
      dueDate: t.dueDate ?? null,
      completed: t.completed,
      projectId: t.projectId ?? null,
    })),
    projects: projects.map((p) => ({ id: p.id, title: p.title, category: p.category })),
    notes: notes.map((n) => ({ id: n.id, title: n.title, body: n.body })),
  };
}

export function describeAction(a: AssistantAction, opts: { tasks: Task[]; projects: Project[] }): {
  icon: "plus" | "edit-3" | "check-circle" | "trash-2" | "folder";
  title: string;
  subtitle: string;
  destructive: boolean;
} {
  const findTask = (id: string) => opts.tasks.find((t) => t.id === id);
  const findProject = (id: string) => opts.projects.find((p) => p.id === id);
  switch (a.type) {
    case "create_task":
      return {
        icon: "plus",
        title: `New task: ${a.title}`,
        subtitle: [a.priority ?? "normal", a.category ?? "personal", a.dueDate ? "with a due date" : null]
          .filter(Boolean)
          .join(" · "),
        destructive: false,
      };
    case "update_task": {
      const t = findTask(a.id);
      const parts: string[] = [];
      if (a.patch.title) parts.push(`title → "${a.patch.title}"`);
      if (a.patch.priority) parts.push(`priority → ${a.patch.priority}`);
      if (a.patch.category) parts.push(`category → ${a.patch.category}`);
      if (a.patch.dueDate !== undefined)
        parts.push(a.patch.dueDate ? `due → ${a.patch.dueDate.slice(0, 10)}` : "due cleared");
      return {
        icon: "edit-3",
        title: `Update: ${t?.title ?? a.id}`,
        subtitle: parts.join(" · ") || "no changes",
        destructive: false,
      };
    }
    case "complete_task": {
      const t = findTask(a.id);
      return {
        icon: "check-circle",
        title: `Complete: ${t?.title ?? a.id}`,
        subtitle: "Mark as done",
        destructive: false,
      };
    }
    case "delete_task": {
      const t = findTask(a.id);
      return {
        icon: "trash-2",
        title: `Delete task: ${t?.title ?? a.id}`,
        subtitle: "This cannot be undone",
        destructive: true,
      };
    }
    case "create_project":
      return {
        icon: "folder",
        title: `New project: ${a.title}`,
        subtitle: a.category ?? "personal",
        destructive: false,
      };
    case "delete_project": {
      const p = findProject(a.id);
      return {
        icon: "trash-2",
        title: `Delete project: ${p?.title ?? a.id}`,
        subtitle: "Tasks will be unlinked",
        destructive: true,
      };
    }
  }
}
