import { Task, Priority, Category, ItemType } from "@/src/store/types";

export function startOfDay(d: Date | string): Date {
  const dt = typeof d === "string" ? new Date(d) : new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function endOfDay(d: Date | string): Date {
  const dt = typeof d === "string" ? new Date(d) : new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function addDays(d: Date, days: number): Date {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt;
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function isOverdue(t: Task): boolean {
  if (!t.dueDate || t.completed) return false;
  return endOfDay(t.dueDate).getTime() < Date.now();
}

export function isDueToday(t: Task): boolean {
  if (!t.dueDate) return false;
  return isSameDay(new Date(t.dueDate), new Date());
}

export function isDueTomorrow(t: Task): boolean {
  if (!t.dueDate) return false;
  return isSameDay(new Date(t.dueDate), addDays(new Date(), 1));
}

export function isDueThisWeek(t: Task): boolean {
  if (!t.dueDate) return false;
  const d = new Date(t.dueDate);
  const now = new Date();
  return d.getTime() > endOfDay(addDays(now, 1)).getTime() && d.getTime() <= endOfDay(addDays(now, 7)).getTime();
}

export function priorityLabel(p: Priority): string {
  return p === "low" ? "Low" : p === "high" ? "High" : "Normal";
}

export function categoryLabel(c: Category): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export function itemTypeLabel(t: ItemType): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const CATEGORY_OPTIONS: Category[] = ["personal", "work", "study", "health", "shopping", "other"];
export const PRIORITY_OPTIONS: Priority[] = ["low", "normal", "high"];
export const TYPE_OPTIONS: ItemType[] = ["task", "goal", "idea", "reminder", "project"];

export function priorityRank(p: Priority): number {
  return p === "high" ? 0 : p === "normal" ? 1 : 2;
}
