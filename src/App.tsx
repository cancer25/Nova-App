import React, { useState, useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './store/store';
import { ThemeContext, resolveColors, ThemePref } from './theme';
import { Icon } from './components/Icon';
import { HomeScreen } from './screens/HomeScreen';
import { TodayScreen } from './screens/TodayScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { NotesScreen } from './screens/NotesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SmartCaptureModal } from './screens/SmartCaptureModal';
import { QuickCaptureModal } from './screens/QuickCaptureModal';
import { AssistantModal } from './screens/AssistantModal';
import { TaskDetailModal } from './screens/TaskDetailModal';
import { ProjectDetailModal } from './screens/ProjectDetailModal';
import { NoteDetailModal } from './screens/NoteDetailModal';
import { SearchModal } from './screens/SearchModal';
import { OnboardingModal } from './screens/OnboardingModal';

type Tab = 'home' | 'today' | 'projects' | 'notes' | 'profile';

function NovaApp() {
  const { data, loading, addProject, addNote } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [themePref, setThemePref] = useState<ThemePref>('dark');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>('dark');

  // Popover speed dial state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement | null>(null);

  // Modals state
  const [showAssistant, setShowAssistant] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [showSmartCapture, setShowSmartCapture] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sync theme with system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemScheme(match.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => {
        setSystemScheme(e.matches ? 'dark' : 'light');
      };
      match.addEventListener('change', listener);
      return () => match.removeEventListener('change', listener);
    }
  }, []);

  // Sync user theme preference from store settings
  useEffect(() => {
    if (data.settings.themePref) {
      setThemePref(data.settings.themePref);
    }
  }, [data.settings.themePref]);

  const { colors, isDark } = resolveColors(themePref, systemScheme);

  // Check onboarding on initial load
  useEffect(() => {
    if (!loading && data.settings.onboarded === false) {
      setShowOnboarding(true);
    }
  }, [loading, data.settings.onboarded]);

  // Handle keyboard navigation (Escape to close dial)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popoverOpen) {
        setPopoverOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [popoverOpen]);

  const closeDial = () => {
    setPopoverOpen(false);
  };

  const toggleDial = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPopoverOpen((prev) => !prev);
  };

  const handleSelectTab = (tab: Tab) => {
    setActiveTab(tab);
    setPopoverOpen(false);
  };

  const handleCreateProject = () => {
    const p = addProject({ title: 'Untitled project', category: 'personal' });
    setSelectedProjectId(p.id);
  };

  const handleCreateNote = () => {
    const n = addNote({ title: '', body: '' });
    setSelectedNoteId(n.id);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.surface, color: colors.onSurface }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center animate-spin"
            style={{ backgroundColor: colors.brandTertiary, color: colors.brandPrimary }}
          >
            <Icon name="rotate-ccw" size={20} />
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase opacity-60">
            Loading NOVA...
          </span>
        </div>
      </div>
    );
  }

  const todayCount = data.tasks.filter((t) => !t.completed).length;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        pref: themePref,
        setPref: setThemePref,
      }}
    >
      <div
        className="min-h-screen flex flex-col transition-colors selection:bg-emerald-600/30 selection:text-white"
        style={{
          backgroundColor: colors.surface,
          color: colors.onSurface,
        }}
      >
        {/* Upperbar: [Home, Today, Projects, Notes, Profile] removed, keeping logo & quick actions */}
        <header
          className="sticky top-0 z-30 border-b backdrop-blur-md bg-opacity-90 transition-colors"
          style={{
            backgroundColor: `${colors.surface}EE`,
            borderColor: colors.divider,
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Brand Logo & Name */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setActiveTab('home')}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: colors.brandPrimary,
                  color: colors.onBrandPrimary,
                }}
              >
                <Icon name="zap" size={17} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black tracking-tight">NOVA</span>
                <span className="text-[11px] font-semibold opacity-40 capitalize">
                  {activeTab}
                </span>
              </div>
            </div>

            {/* Top Right Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSmartCapture(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:brightness-105"
                style={{
                  backgroundColor: colors.brandTertiary,
                  borderColor: colors.brandSecondary,
                  color: colors.onBrandTertiary,
                }}
                title="Smart natural-language capture"
              >
                <Icon name="sparkles" size={13} color={colors.brandPrimary} />
                <span>Smart</span>
              </button>

              <button
                onClick={() => setShowAssistant(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95"
                style={{
                  backgroundColor: colors.brandPrimary,
                  color: colors.onBrandPrimary,
                }}
                title="Ask NOVA Assistant"
              >
                <Icon name="zap" size={14} />
                <span className="hidden sm:inline">Ask NOVA</span>
              </button>

              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-full border transition-all hover:opacity-80 active:scale-95"
                style={{
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                }}
                title="Search"
              >
                <Icon name="search" size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <HomeScreen
              onOpenAssistant={() => setShowAssistant(true)}
              onOpenSearch={() => setShowSearch(true)}
              onOpenCapture={() => setShowCapture(true)}
              onOpenSmartCapture={() => setShowSmartCapture(true)}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'today' && (
            <TodayScreen
              onOpenCapture={() => setShowCapture(true)}
              onSelectTask={(id) => setSelectedTaskId(id)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsScreen
              onSelectProject={(id) => setSelectedProjectId(id)}
              onCreateProject={handleCreateProject}
            />
          )}

          {activeTab === 'notes' && (
            <NotesScreen
              onSelectNote={(id) => setSelectedNoteId(id)}
              onCreateNote={handleCreateNote}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen onReplayOnboarding={() => setShowOnboarding(true)} />
          )}
        </main>

        {/* Smooth Backdrop for Popover Dial */}
        {popoverOpen && (
          <div
            className="fixed inset-0 z-[99990] bg-black/35 backdrop-blur-[2px] transition-opacity duration-200"
            onClick={closeDial}
            aria-hidden="true"
          />
        )}

        {/* Popover Speed Dial Dock: Each item in an individual bubble */}
        <div className="fb-08__dock" ref={dockRef}>
          <ul
            className={`fb-08__dial ${popoverOpen ? 'fb-08__dial--open' : ''}`}
            id="fb-08-dial"
            role="menu"
            aria-label="Navigation menu"
          >
            {/* 1. Home */}
            <li>
              <button
                className={`fb-08__act ${activeTab === 'home' ? 'fb-08__act--active' : ''}`}
                type="button"
                onClick={() => handleSelectTab('home')}
                style={{
                  color: activeTab === 'home' ? colors.brandPrimary : colors.onSurface,
                  backgroundColor: activeTab === 'home' ? colors.brandTertiary : colors.surfaceSecondary,
                  borderColor: activeTab === 'home' ? colors.brandPrimary : colors.border,
                }}
              >
                <span
                  className="fb-08__ico"
                  aria-hidden="true"
                  style={{
                    backgroundColor: activeTab === 'home' ? colors.brandPrimary : colors.surfaceTertiary,
                    color: activeTab === 'home' ? colors.onBrandPrimary : colors.muted,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span>
                <span className="flex-1 font-semibold pr-1">Home</span>
              </button>
            </li>

            {/* 2. Today */}
            <li>
              <button
                className={`fb-08__act ${activeTab === 'today' ? 'fb-08__act--active' : ''}`}
                type="button"
                onClick={() => handleSelectTab('today')}
                style={{
                  color: activeTab === 'today' ? colors.brandPrimary : colors.onSurface,
                  backgroundColor: activeTab === 'today' ? colors.brandTertiary : colors.surfaceSecondary,
                  borderColor: activeTab === 'today' ? colors.brandPrimary : colors.border,
                }}
              >
                <span
                  className="fb-08__ico"
                  aria-hidden="true"
                  style={{
                    backgroundColor: activeTab === 'today' ? colors.brandPrimary : colors.surfaceTertiary,
                    color: activeTab === 'today' ? colors.onBrandPrimary : colors.muted,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </span>
                <span className="flex-1 font-semibold pr-1">Today</span>
                {todayCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: activeTab === 'today' ? colors.brandPrimary : colors.surfaceTertiary,
                      color: activeTab === 'today' ? colors.onBrandPrimary : colors.muted,
                    }}
                  >
                    {todayCount}
                  </span>
                )}
              </button>
            </li>

            {/* 3. Projects */}
            <li>
              <button
                className={`fb-08__act ${activeTab === 'projects' ? 'fb-08__act--active' : ''}`}
                type="button"
                onClick={() => handleSelectTab('projects')}
                style={{
                  color: activeTab === 'projects' ? colors.brandPrimary : colors.onSurface,
                  backgroundColor: activeTab === 'projects' ? colors.brandTertiary : colors.surfaceSecondary,
                  borderColor: activeTab === 'projects' ? colors.brandPrimary : colors.border,
                }}
              >
                <span
                  className="fb-08__ico"
                  aria-hidden="true"
                  style={{
                    backgroundColor: activeTab === 'projects' ? colors.brandPrimary : colors.surfaceTertiary,
                    color: activeTab === 'projects' ? colors.onBrandPrimary : colors.muted,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                  </svg>
                </span>
                <span className="flex-1 font-semibold pr-1">Projects</span>
                {data.projects.length > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: activeTab === 'projects' ? colors.brandPrimary : colors.surfaceTertiary,
                      color: activeTab === 'projects' ? colors.onBrandPrimary : colors.muted,
                    }}
                  >
                    {data.projects.length}
                  </span>
                )}
              </button>
            </li>

            {/* 4. Notes */}
            <li>
              <button
                className={`fb-08__act ${activeTab === 'notes' ? 'fb-08__act--active' : ''}`}
                type="button"
                onClick={() => handleSelectTab('notes')}
                style={{
                  color: activeTab === 'notes' ? colors.brandPrimary : colors.onSurface,
                  backgroundColor: activeTab === 'notes' ? colors.brandTertiary : colors.surfaceSecondary,
                  borderColor: activeTab === 'notes' ? colors.brandPrimary : colors.border,
                }}
              >
                <span
                  className="fb-08__ico"
                  aria-hidden="true"
                  style={{
                    backgroundColor: activeTab === 'notes' ? colors.brandPrimary : colors.surfaceTertiary,
                    color: activeTab === 'notes' ? colors.onBrandPrimary : colors.muted,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                  </svg>
                </span>
                <span className="flex-1 font-semibold pr-1">Notes</span>
                {data.notes.length > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      backgroundColor: activeTab === 'notes' ? colors.brandPrimary : colors.surfaceTertiary,
                      color: activeTab === 'notes' ? colors.onBrandPrimary : colors.muted,
                    }}
                  >
                    {data.notes.length}
                  </span>
                )}
              </button>
            </li>

            {/* 5. Profile */}
            <li>
              <button
                className={`fb-08__act ${activeTab === 'profile' ? 'fb-08__act--active' : ''}`}
                type="button"
                onClick={() => handleSelectTab('profile')}
                style={{
                  color: activeTab === 'profile' ? colors.brandPrimary : colors.onSurface,
                  backgroundColor: activeTab === 'profile' ? colors.brandTertiary : colors.surfaceSecondary,
                  borderColor: activeTab === 'profile' ? colors.brandPrimary : colors.border,
                }}
              >
                <span
                  className="fb-08__ico"
                  aria-hidden="true"
                  style={{
                    backgroundColor: activeTab === 'profile' ? colors.brandPrimary : colors.surfaceTertiary,
                    color: activeTab === 'profile' ? colors.onBrandPrimary : colors.muted,
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                </span>
                <span className="flex-1 font-semibold pr-1">Profile</span>
              </button>
            </li>
          </ul>

          {/* FAB button toggles the popover dial */}
          <button
            className={`fb-08__fab ${popoverOpen ? 'fb-08__fab--open' : ''}`}
            id="fb-08-fab"
            type="button"
            aria-label="Navigation menu"
            aria-expanded={popoverOpen}
            onClick={toggleDial}
            style={{
              backgroundColor: colors.brandPrimary,
              color: colors.onBrandPrimary,
            }}
            title="Navigation Menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Modals & Dialogs */}
        {showCapture && (
          <QuickCaptureModal onClose={() => setShowCapture(false)} />
        )}

        {showSmartCapture && (
          <SmartCaptureModal onClose={() => setShowSmartCapture(false)} />
        )}

        {showAssistant && (
          <AssistantModal onClose={() => setShowAssistant(false)} />
        )}

        {showSearch && (
          <SearchModal
            onClose={() => setShowSearch(false)}
            onSelectTask={(id) => setSelectedTaskId(id)}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onSelectNote={(id) => setSelectedNoteId(id)}
          />
        )}

        {selectedTaskId && (
          <TaskDetailModal
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}

        {selectedProjectId && (
          <ProjectDetailModal
            projectId={selectedProjectId}
            onClose={() => setSelectedProjectId(null)}
            onSelectTask={(id) => setSelectedTaskId(id)}
          />
        )}

        {selectedNoteId && (
          <NoteDetailModal
            noteId={selectedNoteId}
            onClose={() => setSelectedNoteId(null)}
          />
        )}

        {showOnboarding && (
          <OnboardingModal onComplete={() => setShowOnboarding(false)} />
        )}
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <NovaApp />
    </StoreProvider>
  );
}
