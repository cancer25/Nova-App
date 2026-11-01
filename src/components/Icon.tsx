import React from "react";
import {
  Home,
  CheckCircle,
  CheckSquare,
  Folder,
  Edit3,
  User,
  Zap,
  Search,
  Plus,
  Sliders,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Sun,
  Calendar,
  Layers,
  Target,
  Mic,
  AlertCircle,
  Square,
  ArrowUp,
  Clock,
  Sparkles,
} from "lucide-react";

export type IconName =
  | "home"
  | "check-circle"
  | "check-square"
  | "folder"
  | "edit-3"
  | "edit"
  | "user"
  | "zap"
  | "search"
  | "plus"
  | "sliders"
  | "trash-2"
  | "rotate-ccw"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "chevron-down"
  | "x"
  | "sun"
  | "calendar"
  | "layers"
  | "target"
  | "mic"
  | "alert-circle"
  | "square"
  | "arrow-up"
  | "clock"
  | "sparkles";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
  home: Home,
  "check-circle": CheckCircle,
  "check-square": CheckSquare,
  folder: Folder,
  "edit-3": Edit3,
  edit: Edit3,
  user: User,
  zap: Zap,
  search: Search,
  plus: Plus,
  sliders: Sliders,
  "trash-2": Trash2,
  "rotate-ccw": RotateCcw,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  x: X,
  sun: Sun,
  calendar: Calendar,
  layers: Layers,
  target: Target,
  mic: Mic,
  "alert-circle": AlertCircle,
  square: Square,
  "arrow-up": ArrowUp,
  clock: Clock,
  sparkles: Sparkles,
};

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const Comp = ICON_MAP[name] || Zap;
  return <Comp size={size} color={color} className={className} />;
}
