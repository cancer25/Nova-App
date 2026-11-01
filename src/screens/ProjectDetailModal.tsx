import React, { useState } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Icon } from '@/src/components/Icon';
import { CATEGORY_OPTIONS, categoryLabel } from '@/src/utils/date';
import { Category } from '@/src/store/types';

interface ProjectDetailModalProps {
  projectId: string;
  onClose: () => void;
  onSelectTask: (id: string) => void;
}

export function ProjectDetailModal({
  projectId,
  onClose,
  onSelectTask,
}: ProjectDetailModalProps) {
  const { colors } = useTheme();
  const { data, updateProject, deleteProject, addTask, toggleTask } = useStore();
  const project = data.projects.find((p) => p.id === projectId);
  const projectTasks = data.tasks.filter((t) => t.projectId === projectId);

  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!project) return null;

  const doneCount = projectTasks.filter((t) => t.completed).length;
  const totalCount = projectTasks.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleTitleBlur = () => {
    updateProject(project.id, { title: title.trim() || project.title });
  };

  const handleDescBlur = () => {
    updateProject(project.id, { description: description.trim() });
  };

  const handleAddTaskInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      projectId: project.id,
      category: project.category,
    });
    setNewTaskTitle('');
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
            onClick={onClose}
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
            title="Delete project"
          >
            <Icon name="trash-2" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title & Description */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Project title"
              className="w-full bg-transparent text-2xl sm:text-3xl font-bold outline-none leading-snug"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescBlur}
              rows={2}
              placeholder="Describe this project..."
              className="w-full bg-transparent text-sm opacity-70 outline-none resize-none mt-2 leading-relaxed"
            />

            {/* Progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold opacity-60">
                <span>{doneCount}/{totalCount} Completed</span>
                <span>{pct}%</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
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

          {/* Category */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateProject(project.id, { category: cat })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                  style={{
                    backgroundColor:
                      project.category === cat ? colors.brandPrimary : colors.surfaceSecondary,
                    color:
                      project.category === cat ? colors.onBrandPrimary : colors.onSurface,
                    borderColor:
                      project.category === cat ? colors.brandPrimary : colors.border,
                  }}
                >
                  {categoryLabel(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Inline Add Task Form */}
          <form onSubmit={handleAddTaskInline} className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              Tasks
            </span>
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm"
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              }}
            >
              <Icon name="plus" size={17} color={colors.muted} />
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a step to this project (press Enter)..."
                className="w-full bg-transparent outline-none font-medium text-sm"
              />
              {newTaskTitle.trim() && (
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{
                    backgroundColor: colors.brandPrimary,
                    color: colors.onBrandPrimary,
                  }}
                >
                  Add
                </button>
              )}
            </div>
          </form>

          {/* Task List */}
          <div className="space-y-2">
            {projectTasks.length === 0 ? (
              <div className="py-8 text-center text-xs opacity-50">
                No tasks in this project yet. Add your first step above.
              </div>
            ) : (
              projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-opacity-80"
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
                  </div>

                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0"
                    style={{
                      backgroundColor: colors.surfaceTertiary,
                      color: colors.muted,
                    }}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
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
            <h3 className="text-lg font-bold">Delete project?</h3>
            <p className="text-sm opacity-70 leading-relaxed">
              Existing tasks will remain, but will no longer be linked to this project.
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
                  deleteProject(project.id);
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
