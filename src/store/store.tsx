import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData, Task, Project, Note, Settings, Priority } from "./types";

const STORAGE_KEY = "nova.appdata.v1";

const defaultSettings: Settings = {
  name: "",
  onboarded: false,
  focus: null,
  themePref: "system",
  defaultPriority: "normal",
};

const defaultData: AppData = {
  tasks: [],
  projects: [],
  notes: [],
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
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppData;
          setData({
            tasks: parsed.tasks ?? [],
            projects: parsed.projects ?? [],
            notes: parsed.notes ?? [],
            settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
          });
        }
      } catch (e) {
        console.log("Failed to load app data", e);
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) =>
      console.log("Failed to save app data", e),
    );
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
        return {
          ...t,
          completed: !t.completed,
          completedAt: !t.completed ? now : null,
          updatedAt: now,
        };
      }),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
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
    setData(defaultData);
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
