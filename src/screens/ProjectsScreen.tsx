import React, { useMemo } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Icon } from '@/src/components/Icon';

interface ProjectsScreenProps {
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
}

export function ProjectsScreen({ onSelectProject, onCreateProject }: ProjectsScreenProps) {
  const { colors } = useTheme();
  const { data } = useStore();
  const { projects, tasks } = data;

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    projects.forEach((p) => map.set(p.id, { total: 0, done: 0 }));
    tasks.forEach((t) => {
      if (t.projectId && map.has(t.projectId)) {
        const s = map.get(t.projectId)!;
        s.total += 1;
        if (t.completed) s.done += 1;
      }
    });
    return map;
  }, [projects, tasks]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-60">
            Group Related Work
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">Projects</h1>
        </div>

        <button
          onClick={onCreateProject}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm"
          style={{
            backgroundColor: colors.brandPrimary,
            color: colors.onBrandPrimary,
          }}
          title="Create project"
        >
          <Icon name="plus" size={20} />
        </button>
      </div>

      {projects.length === 0 ? (
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
            <Icon name="folder" size={24} color={colors.brandPrimary} />
          </div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-sm opacity-60 max-w-sm mx-auto">
            Group related tasks together into projects, such as a launch, a vacation, or a study unit.
          </p>
          <button
            onClick={onCreateProject}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all mt-2"
            style={{
              backgroundColor: colors.brandPrimary,
              color: colors.onBrandPrimary,
            }}
          >
            Create project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => {
            const s = stats.get(p.id) ?? { total: 0, done: 0 };
            const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] hover:border-opacity-80 flex flex-col justify-between"
                style={{
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  minHeight: '160px',
                }}
              >
                <div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: colors.brandTertiary }}
                  >
                    <Icon name="folder" size={16} color={colors.brandPrimary} />
                  </div>
                  <h3 className="text-base font-semibold leading-snug line-clamp-2">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-xs opacity-60 line-clamp-2 mt-1">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs opacity-60 font-medium">
                    <span>
                      {s.total === 0 ? 'No tasks' : `${s.done}/${s.total} completed`}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: colors.surfaceTertiary }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: colors.brandPrimary,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
