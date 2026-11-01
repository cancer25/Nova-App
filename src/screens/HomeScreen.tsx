import React, { useMemo } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { greetingForNow, isDueToday, isOverdue, formatShortDate } from '@/src/utils/date';
import { Icon } from '@/src/components/Icon';
import { Task } from '@/src/store/types';

interface HomeScreenProps {
  onOpenAssistant: () => void;
  onOpenSearch: () => void;
  onOpenCapture: () => void;
  onOpenSmartCapture: () => void;
  onSelectTask: (id: string) => void;
  onNavigateTab: (tab: 'home' | 'today' | 'projects' | 'notes' | 'profile') => void;
}

export function HomeScreen({
  onOpenAssistant,
  onOpenSearch,
  onOpenCapture,
  onOpenSmartCapture,
  onSelectTask,
  onNavigateTab,
}: HomeScreenProps) {
  const { colors, isDark } = useTheme();
  const { data, toggleTask } = useStore();
  const { tasks, projects, notes, settings } = data;

  const todayTasks = useMemo(
    () => tasks.filter((t) => !t.completed && isDueToday(t)),
    [tasks]
  );
  const overdueTasks = useMemo(
    () => tasks.filter((t) => isOverdue(t)),
    [tasks]
  );
  const completedToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.completed && t.completedAt && isDueToday({ ...t, dueDate: t.completedAt } as any)
      ).length,
    [tasks]
  );
  const totalToday = todayTasks.length + completedToday;
  const progress = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const importantTasks = useMemo(
    () => tasks.filter((t) => !t.completed && t.priority === 'high').slice(0, 4),
    [tasks]
  );

  const summary = (() => {
    if (overdueTasks.length > 0) {
      return `You have ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}.`;
    }
    if (todayTasks.length === 0) {
      return "Your day is clear. Add something you'd like to accomplish.";
    }
    return `You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} for today.`;
  })();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-60">
            {greetingForNow()}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
            {settings.name || 'Friend'}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full font-medium text-sm transition-all shadow-sm active:scale-95"
            style={{
              backgroundColor: colors.brandPrimary,
              color: colors.onBrandPrimary,
            }}
            title="Ask NOVA Assistant"
          >
            <Icon name="zap" size={16} />
            <span className="hidden sm:inline">Ask NOVA</span>
          </button>
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-full border transition-all hover:opacity-80 active:scale-95"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              color: colors.onSurface,
            }}
            title="Search"
          >
            <Icon name="search" size={17} />
          </button>
        </div>
      </div>

      {/* Focus Card */}
      <div
        className="rounded-2xl p-5 sm:p-6 border transition-all"
        style={{
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        }}
      >
        <div className="text-xs font-semibold tracking-wider opacity-60 uppercase">
          Today's Focus
        </div>
        <p className="text-lg sm:text-xl font-medium mt-1 leading-snug">
          {summary}
        </p>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs opacity-75 font-medium">
            <span>Daily Progress</span>
            <span>{progress}%</span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.surfaceTertiary }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: colors.brandPrimary,
              }}
            />
          </div>
        </div>
      </div>

      {/* Capture CTAs */}
      <div className="space-y-2.5">
        <button
          onClick={onOpenCapture}
          className="w-full h-14 rounded-full flex items-center px-4 sm:px-5 gap-3.5 font-medium text-base sm:text-lg transition-transform active:scale-[0.99] shadow-sm hover:brightness-105"
          style={{
            backgroundColor: colors.brandPrimary,
            color: colors.onBrandPrimary,
          }}
        >
          <div className="w-8 h-8 rounded-full bg-white/95 text-[#111111] flex items-center justify-center shrink-0">
            <Icon name="plus" size={18} />
          </div>
          <span>What do you need to do?</span>
        </button>

        <button
          onClick={onOpenSmartCapture}
          className="w-full h-11 rounded-full flex items-center justify-center gap-2 border text-sm font-medium transition-all hover:brightness-105"
          style={{
            backgroundColor: colors.brandTertiary,
            borderColor: colors.brandSecondary,
            color: colors.onBrandTertiary,
          }}
        >
          <Icon name="zap" size={14} color={colors.brandPrimary} />
          <span>Smart capture · write or speak naturally</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('today')}
          className="p-4 rounded-xl border text-left transition-all hover:border-opacity-80 active:scale-98"
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: colors.brandTertiary }}
          >
            <Icon name="check-square" size={15} color={colors.brandPrimary} />
          </div>
          <div className="text-2xl font-bold">
            {tasks.filter((t) => !t.completed).length}
          </div>
          <div className="text-xs opacity-65 font-medium mt-0.5">Active Tasks</div>
        </button>

        <button
          onClick={() => onNavigateTab('projects')}
          className="p-4 rounded-xl border text-left transition-all hover:border-opacity-80 active:scale-98"
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: colors.brandTertiary }}
          >
            <Icon name="folder" size={15} color={colors.brandPrimary} />
          </div>
          <div className="text-2xl font-bold">{projects.length}</div>
          <div className="text-xs opacity-65 font-medium mt-0.5">Projects</div>
        </button>

        <button
          onClick={() => onNavigateTab('notes')}
          className="p-4 rounded-xl border text-left transition-all hover:border-opacity-80 active:scale-98"
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: colors.brandTertiary }}
          >
            <Icon name="edit-3" size={15} color={colors.brandPrimary} />
          </div>
          <div className="text-2xl font-bold">{notes.length}</div>
          <div className="text-xs opacity-65 font-medium mt-0.5">Notes</div>
        </button>

        <button
          onClick={() => onNavigateTab('today')}
          className="p-4 rounded-xl border text-left transition-all hover:border-opacity-80 active:scale-98"
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: colors.brandTertiary }}
          >
            <Icon name="check-circle" size={15} color={colors.brandPrimary} />
          </div>
          <div className="text-2xl font-bold">
            {tasks.filter((t) => t.completed).length}
          </div>
          <div className="text-xs opacity-65 font-medium mt-0.5">Completed</div>
        </button>
      </div>

      {/* Important Tasks */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold">High Priority</h2>
          <button
            onClick={() => onNavigateTab('today')}
            className="text-xs font-semibold hover:underline"
            style={{ color: colors.brandPrimary }}
          >
            View all
          </button>
        </div>

        {importantTasks.length === 0 ? (
          <div
            className="p-6 rounded-xl border text-center text-sm opacity-60"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            }}
          >
            No high-priority tasks pending. Nice work!
          </div>
        ) : (
          <div className="space-y-2">
            {importantTasks.map((t) => (
              <TaskCardRow
                key={t.id}
                task={t}
                onToggle={() => toggleTask(t.id)}
                onSelect={() => onSelectTask(t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCardRow({
  task,
  onToggle,
  onSelect,
}: {
  task: Task;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const { colors } = useTheme();

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:border-opacity-80"
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderColor: colors.border,
      }}
    >
      <button
        onClick={onToggle}
        className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors"
        style={{
          borderColor: task.completed ? colors.brandPrimary : colors.borderStrong,
          backgroundColor: task.completed ? colors.brandPrimary : 'transparent',
          color: colors.onBrandPrimary,
        }}
      >
        {task.completed && <Icon name="check-circle" size={14} />}
      </button>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onSelect}
      >
        <div
          className={`text-sm font-medium truncate ${
            task.completed ? 'line-through opacity-50' : ''
          }`}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs opacity-60">
          <span className="capitalize">{task.category}</span>
          {task.dueDate && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="calendar" size={11} />
                {formatShortDate(task.dueDate)}
              </span>
            </>
          )}
        </div>
      </div>

      <span
        className="px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 uppercase tracking-wider"
        style={{
          backgroundColor:
            task.priority === 'high'
              ? `${colors.error}22`
              : task.priority === 'low'
              ? `${colors.muted}22`
              : `${colors.info}22`,
          color:
            task.priority === 'high'
              ? colors.error
              : task.priority === 'low'
              ? colors.muted
              : colors.info,
        }}
      >
        {task.priority}
      </span>
    </div>
  );
}
