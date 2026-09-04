export type Priority = "low" | "normal" | "high";
export type Category = "personal" | "work" | "study" | "health" | "shopping" | "other";
export type ItemType = "task" | "goal" | "idea" | "reminder" | "project";

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: ItemType;
  priority: Priority;
  category: Category;
  dueDate?: string | null;
  completed: boolean;
  completedAt?: string | null;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type Focus = "tasks" | "studies" | "work" | "personal" | "everything";

export interface Settings {
  name: string;
  onboarded: boolean;
  focus: Focus | null;
  themePref: "system" | "light" | "dark";
  defaultPriority: Priority;
}

export interface AppData {
  tasks: Task[];
  projects: Project[];
  notes: Note[];
  settings: Settings;
}
