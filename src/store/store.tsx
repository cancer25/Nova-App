import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { AppData, Task, Project, Note, Settings, Priority } from "./types";
import { cancelTaskReminder } from "../utils/notifications";

const STORAGE_KEY = "nova.appdata.v1";

const defaultSettings: Settings = {
  name: "Friend",
  onboarded: true,
  focus: "everything",
  themePref: "dark",
  defaultPriority: "normal",
};

const initialTasks: Task[] = [
  {
    id: "task-welcome-1",
    title: "Welcome to NOVA! Explore your new quiet productivity space",
    description: "Tap to edit details, set due dates, or categorize into projects.",
    type: "task",
    priority: "high",
    category: "personal",
    dueDate: new Date().toISOString(),
    completed: false,
    completedAt: null,
    projectId: "proj-intro",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-welcome-2",
    title: "Try Smart Capture: type 'Finish quarterly report tomorrow urgent'",
    description: "Natural language detection automatically extracts dates, categories, and priorities.",
    type: "task",
    priority: "normal",
    category: "work",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    completed: false,
    completedAt: null,
    projectId: "proj-intro",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-welcome-3",
    title: "Ask NOVA Assistant: click the zap icon to plan your day",
    description: "NOVA can review all your items and suggest actionable steps.",
    type: "task",
    priority: "normal",
    category: "study",
    dueDate: null,
    completed: false,
    completedAt: null,
    projectId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialProjects: Project[] = [
  {
    id: "proj-intro",
    title: "Getting Started with NOVA",
    description: "Essential tips and quick setup for organizing your workflow.",
    category: "work",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialNotes: Note[] = [
  {
    id: "note-welcome",
    title: "NOVA Principles: Quiet Clarity",
    body: "1. Capture instantly when ideas strike.\n2. Keep today's high-priority tasks to 2-3 essential items.\n3. Group deep work into focused Projects.\n4. Let AI organize and plan without sacrificing control.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultData: AppData = {
  tasks: initialTasks,
  projects: initialProjects,
  notes: initialNotes,
  settings: defaultSettings,
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

interface Ctx {
  data: AppData;
  loading: boolean;
  addTask: (input: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addProject: (input: Partial<Project> & { title: string }) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addNote: (input: Partial<Note> & { title?: string; body: string }) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        setData({
          tasks: parsed.tasks ?? initialTasks,
          projects: parsed.projects ?? initialProjects,
          notes: parsed.notes ?? initialNotes,
          settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
        });
      }
    } catch (e) {
      console.log("Failed to load app data", e);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.log("Failed to save app data", e);
    }
  }, [data, hydrated]);

  const addTask = useCallback((input: Partial<Task> & { title: string }) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: newId(),
      title: input.title,
      description: input.description ?? "",
      type: input.type ?? "task",
      priority: input.priority ?? "normal",
      category: input.category ?? "personal",
      dueDate: input.dueDate ?? null,
      reminderTime: input.reminderTime ?? null,
      notificationId: input.notificationId ?? null,
      completed: false,
      completedAt: null,
      projectId: input.projectId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    setData((d) => ({ ...d, tasks: [task, ...d.tasks] }));
    return task;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      ),
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => {
        if (t.id !== id) return t;
        const now = new Date().toISOString();
        const willComplete = !t.completed;
        if (willComplete && t.notificationId) {
          cancelTaskReminder(t.notificationId, t.id);
        }
        return {
          ...t,
          completed: willComplete,
          completedAt: willComplete ? now : null,
          updatedAt: now,
        };
      }),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((d) => {
      const taskToDelete = d.tasks.find((t) => t.id === id);
      if (taskToDelete?.notificationId) {
        cancelTaskReminder(taskToDelete.notificationId, id);
      }
      return { ...d, tasks: d.tasks.filter((t) => t.id !== id) };
    });
  }, []);

  const addProject = useCallback((input: Partial<Project> & { title: string }) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: newId(),
      title: input.title,
      description: input.description ?? "",
      category: input.category ?? "personal",
      createdAt: now,
      updatedAt: now,
    };
    setData((d) => ({ ...d, projects: [project, ...d.projects] }));
    return project;
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      projects: d.projects.filter((p) => p.id !== id),
      tasks: d.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
    }));
  }, []);

  const addNote = useCallback((input: Partial<Note> & { body: string }) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: newId(),
      title: input.title ?? "",
      body: input.body,
      createdAt: now,
      updatedAt: now,
    };
    setData((d) => ({ ...d, notes: [note, ...d.notes] }));
    return note;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setData((d) => ({
      ...d,
      notes: d.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(() => {
    setData({
      tasks: [],
      projects: [],
      notes: [],
      settings: defaultSettings,
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      loading,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      addProject,
      updateProject,
      deleteProject,
      addNote,
      updateNote,
      deleteNote,
      updateSettings,
      resetAll,
    }),
    [
      data,
      loading,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      addProject,
      updateProject,
      deleteProject,
      addNote,
      updateNote,
      deleteNote,
      updateSettings,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
