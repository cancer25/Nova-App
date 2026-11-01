import React, { useMemo } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { isDueToday, isOverdue, isDueTomorrow, isDueThisWeek, priorityRank, formatShortDate } from '@/src/utils/date';
import { Icon } from '@/src/components/Icon';
import { Task } from '@/src/store/types';

interface TodayScreenProps {
  onOpenCapture: () => void;
  onSelectTask: (id: string) => void;
}

export function TodayScreen({ onOpenCapture, onSelectTask }: TodayScreenProps) {
  const { colors } = useTheme();
  const { data, toggleTask } = useStore();
  const { tasks } = data;

  const sections = useMemo(() => {
    const overdue = tasks.filter((t) => isOverdue(t));
    const today = tasks
      .filter((t) => !t.completed && isDueToday(t))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    const tomorrow = tasks
      .filter((t) => !t.completed && isDueTomorrow(t))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    const upcoming = tasks
      .filter((t) => !t.completed && isDueThisWeek(t))
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    const noDate = tasks.filter((t) => !t.completed && !t.dueDate);
    const completed = tasks
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
      .slice(0, 25);

    const list: { key: string; title: string; count: number; items: Task[] }[] = [];
    if (overdue.length) list.push({ key: 'overdue', title: 'Overdue', count: overdue.length, items: overdue });
    if (today.length) list.push({ key: 'today', title: 'Today', count: today.length, items: today });
    if (tomorrow.length) list.push({ key: 'tomorrow', title: 'Tomorrow', count: tomorrow.length, items: tomorrow });
    if (upcoming.length) list.push({ key: 'upcoming', title: 'Upcoming This Week', count: upcoming.length, items: upcoming });
    if (noDate.length) list.push({ key: 'unscheduled', title: 'Unscheduled', count: noDate.length, items: noDate });
    if (completed.length) list.push({ key: 'completed', title: 'Completed', count: completed.length, items: completed });
    return list;
  }, [tasks]);

  const totalDueTodayOrOverdue = tasks.filter((t) => !t.completed && (isDueToday(t) || isOverdue(t))).length;

  const todayDateStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-60">
            {todayDateStr}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">Today</h1>
          <p className="text-xs sm:text-sm opacity-65 mt-1 font-medium">
            {totalDueTodayOrOverdue === 0
              ? 'Nothing due today.'
              : `${totalDueTodayOrOverdue} item${totalDueTodayOrOverdue === 1 ? '' : 's'} to complete`}
          </p>
        </div>

        <button
          onClick={onOpenCapture}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          style={{
            backgroundColor: colors.brandPrimary,
            color: colors.onBrandPrimary,
          }}
          title="Add task"
        >
          <Icon name="plus" size={20} />
        </button>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div
          className="p-12 rounded-2xl border text-center space-y-3"
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <div
            className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: colors.brandTertiary }}
          >
            <Icon name="sun" size={24} color={colors.brandPrimary} />
          </div>
          <h3 className="text-lg font-semibold">All caught up for today</h3>
          <p className="text-sm opacity-60 max-w-sm mx-auto">
            You have no pending tasks. Add something you would like to accomplish.
          </p>
          <button
            onClick={onOpenCapture}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all mt-2"
            style={{
              backgroundColor: colors.brandPrimary,
              color: colors.onBrandPrimary,
            }}
          >
            Add a task
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: section.key === 'overdue' ? colors.error : colors.muted,
                  }}
                >
                  {section.title}
                </span>
                <span className="text-xs opacity-50 font-semibold">{section.count}</span>
              </div>

              <div className="space-y-2">
                {section.items.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:border-opacity-80"
                    style={{
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    }}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
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
                      onClick={() => onSelectTask(task.id)}
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
