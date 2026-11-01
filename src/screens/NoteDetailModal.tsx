import React, { useState } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Icon } from '@/src/components/Icon';
import { formatShortDate } from '@/src/utils/date';

interface NoteDetailModalProps {
  noteId: string;
  onClose: () => void;
}

export function NoteDetailModal({ noteId, onClose }: NoteDetailModalProps) {
  const { colors } = useTheme();
  const { data, updateNote, deleteNote } = useStore();
  const note = data.notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!note) return null;

  const commit = () => {
    updateNote(note.id, { title: title.trim(), body });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
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
            onClick={() => {
              commit();
              onClose();
            }}
            className="flex items-center gap-1 text-sm font-semibold opacity-75 hover:opacity-100"
          >
            <Icon name="chevron-left" size={18} />
            <span>Back</span>
          </button>

          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 rounded-full border text-red-500 opacity-75 hover:opacity-100 transition-all hover:bg-red-500/10"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            }}
            title="Delete note"
          >
            <Icon name="trash-2" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commit}
            placeholder="Note Title"
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold outline-none leading-snug"
            autoFocus={!note.title}
          />
          <div className="text-xs opacity-40 font-medium">
            Updated {formatShortDate(note.updatedAt)}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={commit}
            placeholder="Start writing thoughts, plans, meeting minutes, or scratch notes..."
            rows={14}
            className="w-full bg-transparent text-sm sm:text-base opacity-80 outline-none resize-none leading-relaxed font-normal pt-2"
          />
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
            <h3 className="text-lg font-bold">Delete note?</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              Are you sure you want to delete this note? This action cannot be undone.
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
                  deleteNote(note.id);
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
