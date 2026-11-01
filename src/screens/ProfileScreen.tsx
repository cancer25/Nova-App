import React, { useState } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme, ThemePref } from '@/src/theme';
import { Icon } from '@/src/components/Icon';
import { Priority } from '@/src/store/types';

interface ProfileScreenProps {
  onReplayOnboarding: () => void;
}

export function ProfileScreen({ onReplayOnboarding }: ProfileScreenProps) {
  const { colors, pref, setPref } = useTheme();
  const { data, updateSettings, resetAll } = useStore();
  const { settings, tasks, projects, notes } = data;
  const [editingName, setEditingName] = useState(settings.name);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleNameBlur = () => {
    updateSettings({ name: editingName.trim() || 'Friend' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider font-semibold opacity-60">You</span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">Profile</h1>
      </div>

      {/* Profile Card */}
      <div
        className="rounded-2xl p-5 sm:p-6 border space-y-5"
        style={{
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              backgroundColor: colors.brandTertiary,
              color: colors.brandPrimary,
            }}
          >
            {(settings.name || 'N').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs uppercase tracking-wider font-medium opacity-60">
              Display Name
            </label>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Your name"
              className="w-full bg-transparent text-lg font-semibold outline-none border-b border-transparent focus:border-emerald-600 transition-colors py-0.5"
            />
          </div>
        </div>

        <div
          className="grid grid-cols-4 pt-4 border-t text-center gap-2"
          style={{ borderColor: colors.divider }}
        >
          <div>
            <div className="text-xl sm:text-2xl font-bold">{tasks.length}</div>
            <div className="text-xs opacity-60 font-medium">Tasks</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold">
              {tasks.filter((t) => t.completed).length}
            </div>
            <div className="text-xs opacity-60 font-medium">Done</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold">{projects.length}</div>
            <div className="text-xs opacity-60 font-medium">Projects</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold">{notes.length}</div>
            <div className="text-xs opacity-60 font-medium">Notes</div>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-wider font-bold opacity-60 px-1">
          Appearance
        </span>
        <div className="flex gap-2 p-1 rounded-xl border max-w-sm" style={{ borderColor: colors.border, backgroundColor: colors.surfaceSecondary }}>
          {(['dark', 'light', 'system'] as const).map((mode) => {
            const active = settings.themePref === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  updateSettings({ themePref: mode });
                  setPref(mode);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all"
                style={{
                  backgroundColor: active ? colors.brandPrimary : 'transparent',
                  color: active ? colors.onBrandPrimary : colors.onSurface,
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Default Priority Settings */}
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-wider font-bold opacity-60 px-1">
          Default Task Priority
        </span>
        <div className="flex gap-2 p-1 rounded-xl border max-w-sm" style={{ borderColor: colors.border, backgroundColor: colors.surfaceSecondary }}>
          {(['low', 'normal', 'high'] as const).map((pri) => {
            const active = settings.defaultPriority === pri;
            return (
              <button
                key={pri}
                onClick={() => updateSettings({ defaultPriority: pri })}
                className="flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all"
                style={{
                  backgroundColor: active ? colors.brandPrimary : 'transparent',
                  color: active ? colors.onBrandPrimary : colors.onSurface,
                }}
              >
                {pri}
              </button>
            );
          })}
        </div>
      </div>

      {/* Onboarding Guide */}
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-wider font-bold opacity-60 px-1">
          Introduction
        </span>
        <button
          onClick={onReplayOnboarding}
          className="w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all hover:border-opacity-80"
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <div>
            <div className="text-sm font-semibold">View Onboarding Tour</div>
            <div className="text-xs opacity-60 mt-0.5">
              Review NOVA philosophy, principles, and feature guide
            </div>
          </div>
          <Icon name="chevron-right" size={18} color={colors.muted} />
        </button>
      </div>

      {/* Data Management */}
      <div className="space-y-3 pt-2">
        <span className="text-xs uppercase tracking-wider font-bold opacity-60 px-1">
          Data Management
        </span>
        <button
          onClick={() => setShowConfirmReset(true)}
          className="w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all hover:border-red-500/50"
          style={{
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          }}
        >
          <div>
            <div className="text-sm font-semibold text-red-500">Clear All Data</div>
            <div className="text-xs opacity-60 mt-0.5">
              Deletes every task, project, and note permanently
            </div>
          </div>
          <Icon name="trash-2" size={18} color={colors.error} />
        </button>
      </div>

      {/* Version */}
      <div className="pt-6 text-center text-xs opacity-40 font-medium">
        NOVA · v1.0.0 Web Edition
      </div>

      {/* Confirm Reset Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-2xl p-6 border shadow-2xl space-y-4"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            }}
          >
            <h3 className="text-lg font-bold">Clear all data?</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              This will permanently delete all your tasks, projects, notes, and chat history. This action cannot be undone.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
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
                  resetAll();
                  setShowConfirmReset(false);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all bg-red-600 text-white hover:bg-red-700"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
