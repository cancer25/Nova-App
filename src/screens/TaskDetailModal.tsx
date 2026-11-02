import React, { useState } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Icon } from '@/src/components/Icon';
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
  categoryLabel,
  priorityLabel,
  itemTypeLabel,
  formatShortDate,
  formatLocalDateTime,
  formatTimeOnly,
  toLocalDatetimeInputString,
  addDays,
} from '@/src/utils/date';
import { scheduleTaskReminder, cancelTaskReminder, getUserTimeZone } from '@/src/utils/notifications';
import { Priority, Category, ItemType } from '@/src/store/types';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { colors } = useTheme();
  const { data, updateTask, deleteTask, toggleTask } = useStore();
  const task = data.tasks.find((t) => t.id === taskId);
  const projects = data.projects;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [customDatetime, setCustomDatetime] = useState(
    task?.reminderTime ? toLocalDatetimeInputString(new Date(task.reminderTime)) : toLocalDatetimeInputString()
  );

  if (!task) return null;

  const commit = (patch: Partial<typeof task>) => updateTask(task.id, patch);

  const handleTitleBlur = () => {
    commit({ title: title.trim() || task.title });
  };

  const handleDescBlur = () => {
    commit({ description: description.trim() });
  };

  const handleSetReminder = async (targetDate: Date) => {
    if (task.notificationId) {
      await cancelTaskReminder(task.notificationId, task.id);
    }
    const notifId = await scheduleTaskReminder({
      id: task.id,
      title: title.trim() || task.title,
      body: description.trim() || 'Time to complete your task!',
      date: targetDate,
    });
    commit({
      reminderTime: targetDate.toISOString(),
      notificationId: notifId,
      dueDate: targetDate.toISOString(),
    });
  };

  const handleClearReminder = async () => {
    if (task.notificationId) {
      await cancelTaskReminder(task.notificationId, task.id);
    }
    commit({ reminderTime: null, notificationId: null });
  };

  const setDueQuick = (key: string) => {
    if (key === 'none') commit({ dueDate: null });
    else if (key === 'today') commit({ dueDate: new Date().toISOString() });
    else if (key === 'tomorrow') commit({ dueDate: addDays(new Date(), 1).toISOString() });
    else if (key === 'week') commit({ dueDate: addDays(new Date(), 7).toISOString() });
  };

  const dueKey: 'none' | 'today' | 'tomorrow' | 'week' | 'custom' = !task.dueDate
    ? 'none'
    : (() => {
        const d = new Date(task.dueDate);
        const now = new Date();
        const isSame = (a: Date, b: Date) => a.toDateString() === b.toDateString();
        if (isSame(d, now)) return 'today';
        if (isSame(d, addDays(now, 1))) return 'tomorrow';
        return 'custom';
      })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: colors.divider }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm font-semibold opacity-75 hover:opacity-100"
          >
            <Icon name="chevron-left" size={18} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleTask(task.id)}
              className="p-2 rounded-full border opacity-75 hover:opacity-100 transition-all"
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              }}
              title={task.completed ? 'Mark incomplete' : 'Mark completed'}
            >
              <Icon
                name={task.completed ? 'rotate-ccw' : 'check-circle'}
                size={18}
                color={task.completed ? colors.muted : colors.brandPrimary}
              />
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 rounded-full border text-red-500 opacity-75 hover:opacity-100 transition-all hover:bg-red-500/10"
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              }}
              title="Delete task"
            >
              <Icon name="trash-2" size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title */}
          <div>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              rows={2}
              placeholder="Task title"
              className={`w-full bg-transparent text-xl sm:text-2xl font-bold outline-none resize-none leading-snug ${
                task.completed ? 'line-through opacity-50' : ''
              }`}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              rows={3}
              placeholder="Add a detailed description or sub-notes..."
              className="w-full bg-transparent text-sm opacity-70 outline-none resize-none mt-2 leading-relaxed"
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              Type
            </span>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.filter((t) => t !== 'project' && t !== 'idea').map((t) => (
                <button
                  key={t}
                  onClick={() => commit({ type: t })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                  style={{
                    backgroundColor: task.type === t ? colors.brandPrimary : colors.surfaceSecondary,
                    color: task.type === t ? colors.onBrandPrimary : colors.onSurface,
                    borderColor: task.type === t ? colors.brandPrimary : colors.border,
                  }}
                >
                  {itemTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              Priority
            </span>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => commit({ priority: p })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                  style={{
                    backgroundColor:
                      task.priority === p ? colors.brandPrimary : colors.surfaceSecondary,
                    color: task.priority === p ? colors.onBrandPrimary : colors.onSurface,
                    borderColor: task.priority === p ? colors.brandPrimary : colors.border,
                  }}
                >
                  {priorityLabel(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-60">
              <span>Due Date</span>
              {task.dueDate && <span>{formatShortDate(task.dueDate)}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'none', label: 'None' },
                { key: 'today', label: 'Today' },
                { key: 'tomorrow', label: 'Tomorrow' },
                { key: 'week', label: 'In a week' },
              ].map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDueQuick(d.key)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    backgroundColor:
                      dueKey === d.key ? colors.brandPrimary : colors.surfaceSecondary,
                    color: dueKey === d.key ? colors.onBrandPrimary : colors.onSurface,
                    borderColor: dueKey === d.key ? colors.brandPrimary : colors.border,
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Local Time Reminder & Alarm */}
          <div className="space-y-3 p-4 rounded-2xl border" style={{ backgroundColor: colors.surfaceSecondary, borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="bell" size={15} color={colors.brandPrimary} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Reminder & Phone Alarm
                </span>
              </div>
              <span className="text-[11px] opacity-60 font-medium">
                {getUserTimeZone()}
              </span>
            </div>

            {task.reminderTime ? (
              <div
                className="p-3.5 rounded-xl border flex items-center justify-between gap-3"
                style={{
                  backgroundColor: `${colors.brandPrimary}15`,
                  borderColor: `${colors.brandPrimary}40`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: colors.brandPrimary, color: colors.onBrandPrimary }}
                  >
                    <Icon name="bell" size={15} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {formatLocalDateTime(task.reminderTime)}
                    </div>
                    <div className="text-[11px] opacity-60">
                      Exact phone alarm & notification scheduled
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClearReminder}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  style={{ borderColor: colors.border }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-xs opacity-60 leading-relaxed">
                Set an alarm to trigger a sound and push notification on your device at your exact local time.
              </p>
            )}

            {/* Quick Reminder Presets */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold opacity-60 block">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: 'In 15 mins',
                    calc: () => new Date(Date.now() + 15 * 60 * 1000),
                  },
                  {
                    label: 'In 1 hour',
                    calc: () => new Date(Date.now() + 60 * 60 * 1000),
                  },
                  {
                    label: 'Tonight at 8 PM',
                    calc: () => {
                      const d = new Date();
                      d.setHours(20, 0, 0, 0);
                      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
                      return d;
                    },
                  },
                  {
                    label: 'Tomorrow at 9 AM',
                    calc: () => {
                      const d = addDays(new Date(), 1);
                      d.setHours(9, 0, 0, 0);
                      return d;
                    },
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleSetReminder(preset.calc())}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      backgroundColor: colors.surfaceTertiary,
                      borderColor: colors.border,
                      color: colors.onSurface,
                    }}
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Datetime Picker */}
            <div className="pt-2 border-t space-y-1.5" style={{ borderColor: colors.divider }}>
              <span className="text-[11px] font-semibold opacity-60 block">
                Or choose exact date & time (Local):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={customDatetime}
                  onChange={(e) => {
                    setCustomDatetime(e.target.value);
                    if (e.target.value) {
                      handleSetReminder(new Date(e.target.value));
                    }
                  }}
                  className="px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium outline-none flex-1"
                  style={{
                    backgroundColor: colors.surfaceTertiary,
                    borderColor: colors.border,
                    color: colors.onSurface,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => commit({ category: cat })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                  style={{
                    backgroundColor:
                      task.category === cat ? colors.brandPrimary : colors.surfaceSecondary,
                    color: task.category === cat ? colors.onBrandPrimary : colors.onSurface,
                    borderColor: task.category === cat ? colors.brandPrimary : colors.border,
                  }}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Project Association */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                Associated Project
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => commit({ projectId: null })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    backgroundColor: !task.projectId ? colors.brandPrimary : colors.surfaceSecondary,
                    color: !task.projectId ? colors.onBrandPrimary : colors.onSurface,
                    borderColor: !task.projectId ? colors.brandPrimary : colors.border,
                  }}
                >
                  None
                </button>
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => commit({ projectId: proj.id })}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      backgroundColor:
                        task.projectId === proj.id ? colors.brandPrimary : colors.surfaceSecondary,
                      color:
                        task.projectId === proj.id ? colors.onBrandPrimary : colors.onSurface,
                      borderColor:
                        task.projectId === proj.id ? colors.brandPrimary : colors.border,
                    }}
                  >
                    {proj.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl p-6 border shadow-2xl space-y-4"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            }}
          >
            <h3 className="text-lg font-bold">Delete task?</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              Are you sure you want to delete "{task.title}"? This cannot be undone.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                style={{
                  backgroundColor: colors.surfaceTertiary,
                  borderColor: colors.border,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTask(task.id);
                  setShowConfirmDelete(false);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
