import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Icon } from '@/src/components/Icon';
import {
  AssistantAction,
  buildContext,
  ChatMsg,
  describeAction,
  extractActions,
} from '@/src/assistant/protocol';
import { streamAssistant } from '@/src/assistant/client';
import { storage } from '@/src/utils/storage';

const CHAT_KEY = 'nova.chat.v1';
const SESSION_KEY = 'nova.chat.session.v1';

const SUGGESTIONS = [
  { label: 'Plan my day', prompt: 'Help me plan today. What should I focus on?', icon: 'sun' },
  { label: 'Plan this week', prompt: 'Help me plan the rest of this week based on my tasks.', icon: 'calendar' },
  { label: 'Organize priorities', prompt: 'Look at my tasks and suggest a cleaner priority setup.', icon: 'layers' },
  { label: 'Break down a goal', prompt: 'I want to break a goal into actionable tasks. Ask me what the goal is.', icon: 'target' },
];

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface AssistantModalProps {
  onClose: () => void;
}

export function AssistantModal({ onClose }: AssistantModalProps) {
  const { colors } = useTheme();
  const {
    data,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    addProject,
    deleteProject,
  } = useStore();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hydratedRef = useRef(false);

  // Load chat
  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<ChatMsg[] | null>(CHAT_KEY, null);
      const sid = await storage.getItem<string | null>(SESSION_KEY, null);
      if (Array.isArray(stored)) setMessages(stored);
      if (sid) {
        setSessionId(sid);
      } else {
        const s = newId();
        setSessionId(s);
        storage.setItem(SESSION_KEY, s);
      }
      hydratedRef.current = true;
    })();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Persist chat
  useEffect(() => {
    if (!hydratedRef.current) return;
    storage.setItem(CHAT_KEY, messages);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  const send = useCallback(
    async (userText: string) => {
      const text = userText.trim();
      if (!text || streaming || !sessionId) return;

      const userMsg: ChatMsg = {
        id: newId(),
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      const asstId = newId();
      const asstMsg: ChatMsg = {
        id: asstId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setMessages((cur) => [...cur, userMsg, asstMsg]);
      setInput('');
      setStreaming(true);
      scrollToBottom();

      const context = buildContext(data.tasks, data.projects, data.notes, data.settings.name);
      const historyForServer = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let buffer = '';

      await streamAssistant(
        {
          sessionId,
          messages: historyForServer,
          context,
          signal: ctrl.signal,
        },
        {
          onDelta: (delta) => {
            buffer += delta;
            const { text: proseSoFar } = extractActions(buffer);
            setMessages((cur) =>
              cur.map((m) => (m.id === asstId ? { ...m, content: proseSoFar } : m))
            );
            scrollToBottom();
          },
          onDone: () => {
            const { text: prose, actions } = extractActions(buffer);
            setMessages((cur) =>
              cur.map((m) =>
                m.id === asstId
                  ? {
                      ...m,
                      content: prose || buffer.trim(),
                      actions: actions.length ? actions : undefined,
                    }
                  : m
              )
            );
            setStreaming(false);
            scrollToBottom();
          },
          onError: (err) => {
            setMessages((cur) =>
              cur.map((m) =>
                m.id === asstId ? { ...m, content: err, error: true } : m
              )
            );
            setStreaming(false);
            scrollToBottom();
          },
        }
      );
    },
    [data, messages, sessionId, streaming, scrollToBottom]
  );

  const applyActions = useCallback(
    (msgId: string, actions: AssistantAction[]) => {
      for (const a of actions) {
        switch (a.type) {
          case 'create_task':
            addTask({
              title: a.title,
              priority: a.priority ?? 'normal',
              category: a.category ?? 'personal',
              dueDate: a.dueDate ?? null,
              projectId: a.projectId ?? null,
            });
            break;
          case 'update_task':
            updateTask(a.id, a.patch);
            break;
          case 'complete_task': {
            const t = data.tasks.find((tt) => tt.id === a.id);
            if (t && !t.completed) toggleTask(a.id);
            break;
          }
          case 'delete_task':
            deleteTask(a.id);
            break;
          case 'create_project':
            addProject({ title: a.title, category: a.category ?? 'personal' });
            break;
          case 'delete_project':
            deleteProject(a.id);
            break;
        }
      }
      setMessages((cur) =>
        cur.map((m) => (m.id === msgId ? { ...m, actionsApplied: true } : m))
      );
    },
    [data.tasks, addTask, updateTask, toggleTask, deleteTask, addProject, deleteProject]
  );

  const discardActions = (msgId: string) => {
    setMessages((cur) =>
      cur.map((m) => (m.id === msgId ? { ...m, actionsDiscarded: true } : m))
    );
  };

  const clearChat = () => {
    setMessages([]);
    const s = newId();
    setSessionId(s);
    storage.setItem(SESSION_KEY, s);
  };

  const empty = messages.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl h-[94vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
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
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.brandPrimary, color: colors.onBrandPrimary }}
            >
              <Icon name="zap" size={15} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">Ask NOVA</h2>
              <span className="text-xs opacity-50 font-medium">
                {streaming ? 'NOVA is thinking...' : 'AI productivity assistant'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!empty && (
              <button
                onClick={clearChat}
                className="p-2 rounded-full opacity-60 hover:opacity-100 transition-opacity"
                title="Clear conversation"
              >
                <Icon name="rotate-ccw" size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full opacity-60 hover:opacity-100 transition-opacity"
              title="Close"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {empty ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.brandTertiary }}
              >
                <Icon name="zap" size={28} color={colors.brandPrimary} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-xl font-bold">Ask NOVA Anything</h3>
                <p className="text-sm opacity-60 leading-relaxed">
                  Plan your day, prioritize upcoming deadlines, or break down goals into clean subtasks. Nothing changes in your workspace without your approval.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-4">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => send(s.prompt)}
                    className="p-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    }}
                  >
                    <Icon name={s.icon} size={15} color={colors.brandPrimary} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm sm:text-base leading-relaxed ${
                      isUser ? 'font-medium rounded-tr-sm' : 'border rounded-tl-sm'
                    }`}
                    style={{
                      backgroundColor: isUser
                        ? colors.brandPrimary
                        : m.error
                        ? `${colors.error}22`
                        : colors.surfaceSecondary,
                      color: isUser
                        ? colors.onBrandPrimary
                        : m.error
                        ? colors.error
                        : colors.onSurface,
                      borderColor: isUser ? 'transparent' : colors.border,
                    }}
                  >
                    {m.content ? (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    ) : streaming ? (
                      <div className="flex gap-1 py-1">
                        <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    ) : null}
                  </div>

                  {/* Actions Block */}
                  {m.actions && m.actions.length > 0 && !m.actionsDiscarded && (
                    <div className="w-full max-w-[88%] mt-2 space-y-2">
                      <div className="space-y-1.5">
                        {m.actions.map((act, i) => {
                          const desc = describeAction(act, {
                            tasks: data.tasks,
                            projects: data.projects,
                          });
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-2.5 p-3 rounded-xl border text-xs"
                              style={{
                                backgroundColor: colors.surfaceSecondary,
                                borderColor: desc.destructive ? colors.error : colors.border,
                              }}
                            >
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                style={{
                                  backgroundColor: desc.destructive
                                    ? `${colors.error}22`
                                    : colors.brandTertiary,
                                }}
                              >
                                <Icon
                                  name={desc.icon}
                                  size={13}
                                  color={desc.destructive ? colors.error : colors.brandPrimary}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">{desc.title}</div>
                                {desc.subtitle && (
                                  <div className="opacity-60 text-xs mt-0.5">
                                    {desc.subtitle}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {m.actionsApplied ? (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-max"
                          style={{
                            backgroundColor: colors.brandTertiary,
                            color: colors.brandPrimary,
                          }}
                        >
                          <Icon name="check-circle" size={13} />
                          <span>Applied to your workspace</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => discardActions(m.id)}
                            className="px-4 py-1.5 rounded-full border text-xs font-semibold opacity-75 hover:opacity-100"
                            style={{
                              backgroundColor: colors.surfaceSecondary,
                              borderColor: colors.border,
                            }}
                          >
                            Discard
                          </button>
                          <button
                            onClick={() => applyActions(m.id, m.actions!)}
                            className="flex-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
                            style={{
                              backgroundColor: colors.brandPrimary,
                              color: colors.onBrandPrimary,
                            }}
                          >
                            Apply {m.actions.length} Changes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input Composer */}
        <div
          className="p-3 sm:p-4 border-t shrink-0"
          style={{ borderColor: colors.divider }}
        >
          <div
            className="flex items-center gap-2 p-1.5 pl-4 rounded-2xl border transition-all"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={streaming ? 'NOVA is replying...' : 'Message NOVA...'}
              disabled={streaming}
              className="w-full bg-transparent outline-none text-sm sm:text-base font-medium"
            />
            <button
              onClick={() => (streaming ? abortRef.current?.abort() : send(input))}
              disabled={!streaming && !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
              style={{
                backgroundColor: colors.brandPrimary,
                color: colors.onBrandPrimary,
              }}
            >
              <Icon name={streaming ? 'square' : 'arrow-up'} size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
