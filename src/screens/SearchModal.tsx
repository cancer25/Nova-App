import React, { useState, useMemo } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Icon } from '@/src/components/Icon';
import { formatShortDate } from '@/src/utils/date';

interface SearchModalProps {
  onClose: () => void;
  onSelectTask: (id: string) => void;
  onSelectProject: (id: string) => void;
  onSelectNote: (id: string) => void;
}

export function SearchModal({
  onClose,
  onSelectTask,
  onSelectProject,
  onSelectNote,
}: SearchModalProps) {
  const { colors } = useTheme();
  const { data } = useStore();
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return { tasks: [], projects: [], notes: [] };
    return {
      tasks: data.tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description ?? '').toLowerCase().includes(query)
      ),
      projects: data.projects.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.description ?? '').toLowerCase().includes(query)
      ),
      notes: data.notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.body.toLowerCase().includes(query)
      ),
    };
  }, [data, query]);

  const total =
    results.tasks.length + results.projects.length + results.notes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-14 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        {/* Search Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0"
          style={{ borderColor: colors.divider }}
        >
          <Icon name="search" size={18} color={colors.muted} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks, projects, notes..."
            className="w-full bg-transparent outline-none text-base font-medium"
            autoFocus
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="p-1 opacity-50 hover:opacity-100"
            >
              <Icon name="x" size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-sm font-semibold opacity-75 hover:opacity-100 px-1"
          >
            Done
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {!query ? (
            <div className="py-12 text-center space-y-2 opacity-50">
              <Icon name="search" size={28} className="mx-auto" />
              <p className="text-sm">Search across everything in NOVA</p>
            </div>
          ) : total === 0 ? (
            <div className="py-12 text-center space-y-2 opacity-50">
              <p className="text-sm">No matches found for "{q}"</p>
            </div>
          ) : (
            <>
              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-50 px-1">
                    Tasks ({results.tasks.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.tasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onClose();
                          onSelectTask(t.id);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:border-opacity-80 transition-all text-sm font-medium"
                        style={{
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        }}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon name="check-square" size={14} color={colors.brandPrimary} />
                          <span className={`truncate ${t.completed ? 'line-through opacity-50' : ''}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-xs opacity-50 uppercase tracking-wider shrink-0 ml-2">
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {results.projects.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-50 px-1">
                    Projects ({results.projects.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.projects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onClose();
                          onSelectProject(p.id);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:border-opacity-80 transition-all text-sm font-medium"
                        style={{
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        }}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon name="folder" size={14} color={colors.brandPrimary} />
                          <span className="truncate">{p.title}</span>
                        </div>
                        <span className="text-xs opacity-50 capitalize shrink-0 ml-2">
                          {p.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {results.notes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-50 px-1">
                    Notes ({results.notes.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.notes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onClose();
                          onSelectNote(n.id);
                        }}
                        className="p-3 rounded-xl border cursor-pointer hover:border-opacity-80 transition-all text-sm font-medium space-y-1"
                        style={{
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon name="edit-3" size={14} color={colors.brandPrimary} />
                          <span className="truncate font-semibold">{n.title || 'Untitled'}</span>
                        </div>
                        {n.body && (
                          <p className="text-xs opacity-60 line-clamp-1 pl-6">
                            {n.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
