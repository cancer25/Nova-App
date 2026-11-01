import React, { useMemo, useState } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { formatShortDate } from '@/src/utils/date';
import { Icon } from '@/src/components/Icon';

interface NotesScreenProps {
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
}

export function NotesScreen({ onSelectNote, onCreateNote }: NotesScreenProps) {
  const { colors } = useTheme();
  const { data } = useStore();
  const { notes } = data;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, query]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-60">
            Quick Thoughts
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">Notes</h1>
        </div>

        <button
          onClick={onCreateNote}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          style={{
            backgroundColor: colors.brandPrimary,
            color: colors.onBrandPrimary,
          }}
          title="New note"
        >
          <Icon name="plus" size={20} />
        </button>
      </div>

      {/* Search Input */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm"
        style={{
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        }}
      >
        <Icon name="search" size={16} color={colors.muted} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-transparent outline-none placeholder:text-neutral-500 text-sm font-medium"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 opacity-60 hover:opacity-100"
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
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
            <Icon name="edit-3" size={24} color={colors.brandPrimary} />
          </div>
          <h3 className="text-lg font-semibold">
            {notes.length === 0 ? 'No notes yet' : 'No matches found'}
          </h3>
          <p className="text-sm opacity-60 max-w-sm mx-auto">
            {notes.length === 0
              ? 'Capture a quick thought, outline a brainstorm, or store something worth remembering.'
              : 'Try a different search query or clear the filter.'}
          </p>
          {notes.length === 0 && (
            <button
              onClick={onCreateNote}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all mt-2"
              style={{
                backgroundColor: colors.brandPrimary,
                color: colors.onBrandPrimary,
              }}
            >
              New note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className="p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] hover:border-opacity-80 flex flex-col justify-between"
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                minHeight: '130px',
              }}
            >
              <div>
                <h3 className="text-base font-semibold leading-snug line-clamp-1">
                  {note.title.trim() || 'Untitled'}
                </h3>
                {note.body.trim() && (
                  <p className="text-xs sm:text-sm opacity-60 line-clamp-3 mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {note.body}
                  </p>
                )}
              </div>
              <span className="text-[11px] opacity-45 font-medium mt-3">
                {formatShortDate(note.updatedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
