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
  addDays,
} from '@/src/utils/date';
import { Category, Priority, ItemType } from '@/src/store/types';

interface QuickCaptureModalProps {
  onClose: () => void;
}

const QUICK_DATES = [
  { key: 'none', label: 'No date' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'In a week' },
] as const;

export function QuickCaptureModal({ onClose }: QuickCaptureModalProps) {
  const { colors } = useTheme();
  const { data, addTask, addNote, addProject } = useStore();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ItemType>('task');
  const [priority, setPriority] = useState<Priority>(data.settings.defaultPriority);
  const [category, setCategory] = useState<Category>('personal');
  const [dueKey, setDueKey] = useState<'none' | 'today' | 'tomorrow' | 'week'>('none');

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const t = title.trim();

    if (type === 'project') {
      addProject({ title: t, category });
    } else if (type === 'idea') {
      addNote({ title: t, body: '' });
    } else {
      let dueDate: string | null = null;
      const now = new Date();
      if (dueKey === 'today') dueDate = now.toISOString();
      else if (dueKey === 'tomorrow') dueDate = addDays(now, 1).toISOString();
      else if (dueKey === 'week') dueDate = addDays(now, 7).toISOString();
      addTask({ title: t, type, priority, category, dueDate });
    }

    onClose();
  };

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
            className="text-sm opacity-65 hover:opacity-100 font-medium"
          >
            Cancel
          </button>
          <span className="font-semibold text-base">Quick Capture</span>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`text-sm font-bold transition-opacity ${
              canSave ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ color: colors.brandPrimary }}
          >
            Save
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do?"
            rows={3}
            autoFocus
            className="w-full bg-transparent text-xl sm:text-2xl font-semibold outline-none resize-none leading-snug placeholder:opacity-40"
          />

          {/* Type Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              Type
            </span>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                  style={{
                    backgroundColor: type === t ? colors.brandPrimary : colors.surfaceSecondary,
                    color: type === t ? colors.onBrandPrimary : colors.onSurface,
                    borderColor: type === t ? colors.brandPrimary : colors.border,
                  }}
                >
                  {itemTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {type !== 'project' && type !== 'idea' && (
            <>
              {/* Priority */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Priority
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                      style={{
                        backgroundColor:
                          priority === p ? colors.brandPrimary : colors.surfaceSecondary,
                        color: priority === p ? colors.onBrandPrimary : colors.onSurface,
                        borderColor: priority === p ? colors.brandPrimary : colors.border,
                      }}
                    >
                      {priorityLabel(p)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Due Date
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_DATES.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDueKey(d.key)}
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
            </>
          )}

          {/* Category */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                  style={{
                    backgroundColor:
                      category === cat ? colors.brandPrimary : colors.surfaceSecondary,
                    color: category === cat ? colors.onBrandPrimary : colors.onSurface,
                    borderColor: category === cat ? colors.brandPrimary : colors.border,
                  }}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
