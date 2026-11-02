import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Icon } from '@/src/components/Icon';
import { defaultParser, ParsedItem } from '@/src/smart/parser';
import { getSpeechService, SpeechError } from '@/src/speech/service';
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  categoryLabel,
  priorityLabel,
  formatShortDate,
  addDays,
} from '@/src/utils/date';
import { scheduleTaskReminder } from '@/src/utils/notifications';
import { Category, Priority } from '@/src/store/types';

interface SmartCaptureModalProps {
  onClose: () => void;
}

const EXAMPLES = [
  "Study for math exam tomorrow, it's urgent",
  "Buy groceries and call mom this evening",
  "Prepare presentation for the client meeting on Monday",
  "Gym workout tonight and yoga on Sunday",
];

export function SmartCaptureModal({ onClose }: SmartCaptureModalProps) {
  const { colors } = useTheme();
  const { addTask } = useStore();

  const [input, setInput] = useState('');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice capture
  const speech = useMemo(() => getSpeechService(), []);
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const inputBeforeListenRef = useRef('');

  useEffect(() => {
    let mounted = true;
    speech.isAvailable().then((v) => {
      if (mounted) setVoiceSupported(v);
    });
    return () => {
      mounted = false;
      speech.stop().catch(() => {});
    };
  }, [speech]);

  const toggleListening = async () => {
    if (listening) {
      await speech.stop();
      setListening(false);
      return;
    }
    setVoiceMessage(null);
    if (!voiceSupported) {
      setVoiceMessage("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    const granted = await speech.requestPermission();
    if (!granted) {
      setVoiceMessage("Microphone permission was denied. Please allow microphone access in your browser.");
      return;
    }

    inputBeforeListenRef.current = input.trim();
    setListening(true);

    await speech.start({
      onResult: ({ transcript }) => {
        const base = inputBeforeListenRef.current;
        const joined = base ? `${base} ${transcript}` : transcript;
        setInput(joined);
      },
      onError: (err: SpeechError) => {
        setVoiceMessage(err.message || 'Voice recognition error.');
      },
      onEnd: () => {
        setListening(false);
      },
    });
  };

  // Debounced parsing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim()) {
      setItems([]);
      setParsing(false);
      return;
    }
    setParsing(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await defaultParser.parse(input);
        setItems(result);
      } finally {
        setParsing(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  const updateItem = (id: string, patch: Partial<ParsedItem>) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    setItems((cur) => cur.filter((i) => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const setDueQuick = (id: string, key: 'none' | 'today' | 'tomorrow' | 'week') => {
    let dueDate: string | null = null;
    if (key === 'today') dueDate = new Date().toISOString();
    else if (key === 'tomorrow') dueDate = addDays(new Date(), 1).toISOString();
    else if (key === 'week') dueDate = addDays(new Date(), 7).toISOString();
    updateItem(id, { dueDate });
  };

  const saveAll = async () => {
    if (items.length === 0) return;
    for (const it of items) {
      const task = addTask({
        title: it.title,
        priority: it.priority,
        category: it.category,
        dueDate: it.dueDate,
        reminderTime: it.dueDate,
      });

      if (it.dueDate && new Date(it.dueDate).getTime() > Date.now()) {
        scheduleTaskReminder({
          id: task.id,
          title: task.title,
          date: it.dueDate,
        });
      }
    }
    onClose();
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
            className="text-sm opacity-65 hover:opacity-100 font-medium"
          >
            Cancel
          </button>
          <div className="flex items-center gap-1.5 font-semibold text-base">
            <Icon name="zap" size={17} color={colors.brandPrimary} />
            <span>Smart Capture</span>
          </div>
          <button
            onClick={saveAll}
            disabled={items.length === 0}
            className={`text-sm font-bold transition-opacity ${
              items.length > 0 ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ color: colors.brandPrimary }}
          >
            {items.length > 0 ? `Save ${items.length}` : 'Save'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Input Area */}
          <div
            className="rounded-2xl p-4 border transition-all relative"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderColor: listening ? colors.brandPrimary : colors.border,
            }}
          >
            <div className="flex items-start gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening... Speak naturally" : "Type or speak what's on your mind..."}
                rows={3}
                className="w-full bg-transparent outline-none resize-none text-base sm:text-lg font-medium leading-relaxed"
                autoFocus
              />
              <button
                onClick={toggleListening}
                className={`p-3 rounded-full shrink-0 transition-all ${
                  listening ? 'animate-pulse' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: listening ? '#EF4444' : colors.brandTertiary,
                  color: listening ? '#FFFFFF' : colors.brandPrimary,
                }}
                title={listening ? 'Stop listening' : 'Start voice input'}
              >
                <Icon name={listening ? 'square' : 'mic'} size={18} />
              </button>
            </div>

            {voiceMessage && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                <Icon name="alert-circle" size={14} />
                <span>{voiceMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs opacity-50 font-medium" style={{ borderColor: colors.divider }}>
              <Icon name="sparkles" size={13} color={colors.brandPrimary} />
              <span>
                NOVA automatically detects dates, priorities, categories, and multiple tasks.
              </span>
            </div>
          </div>

          {/* Examples if input is empty */}
          {!input.trim() ? (
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider font-bold opacity-60">
                Try an example
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all hover:border-opacity-90 active:scale-98"
                    style={{
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                    }}
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Detected items */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold opacity-60">
                <span>
                  {parsing
                    ? 'Reading natural language...'
                    : items.length === 0
                    ? 'No tasks detected yet'
                    : `${items.length} Task${items.length === 1 ? '' : 's'} Found`}
                </span>
                {parsing && <span className="animate-pulse text-emerald-500">●</span>}
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl p-4 border transition-all space-y-3"
                      style={{
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: colors.brandTertiary }}
                        >
                          <Icon name="check-square" size={13} color={colors.brandPrimary} />
                        </div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          className="w-full bg-transparent font-semibold text-sm sm:text-base outline-none"
                        />
                        <button
                          onClick={() => removeItem(item.id)}
                          className="opacity-50 hover:opacity-100 p-1"
                        >
                          <Icon name="x" size={16} />
                        </button>
                      </div>

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span
                          className="px-2.5 py-1 rounded-full font-medium capitalize"
                          style={{
                            backgroundColor: item.detected.priority
                              ? colors.brandTertiary
                              : colors.surfaceTertiary,
                            color: item.detected.priority
                              ? colors.brandPrimary
                              : colors.muted,
                          }}
                        >
                          {priorityLabel(item.priority)}
                        </span>

                        <span
                          className="px-2.5 py-1 rounded-full font-medium capitalize"
                          style={{
                            backgroundColor: item.detected.category
                              ? colors.brandTertiary
                              : colors.surfaceTertiary,
                            color: item.detected.category
                              ? colors.brandPrimary
                              : colors.muted,
                          }}
                        >
                          {categoryLabel(item.category)}
                        </span>

                        {item.dueDate && (
                          <span
                            className="px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                            style={{
                              backgroundColor: item.detected.dueDate
                                ? colors.brandTertiary
                                : colors.surfaceTertiary,
                              color: item.detected.dueDate
                                ? colors.brandPrimary
                                : colors.muted,
                            }}
                          >
                            <Icon name="calendar" size={11} />
                            {formatShortDate(item.dueDate)}
                          </span>
                        )}

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="ml-auto text-xs font-semibold flex items-center gap-1 opacity-60 hover:opacity-100"
                        >
                          <Icon name="sliders" size={12} />
                          <span>{isExpanded ? 'Done' : 'Tweak'}</span>
                        </button>
                      </div>

                      {/* Quick editor */}
                      {isExpanded && (
                        <div className="pt-3 border-t space-y-3" style={{ borderColor: colors.divider }}>
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 block mb-1.5">
                              Priority
                            </span>
                            <div className="flex gap-1.5">
                              {PRIORITY_OPTIONS.map((p) => (
                                <button
                                  key={p}
                                  onClick={() => updateItem(item.id, { priority: p })}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold capitalize border"
                                  style={{
                                    backgroundColor:
                                      item.priority === p ? colors.brandPrimary : 'transparent',
                                    color:
                                      item.priority === p ? colors.onBrandPrimary : colors.onSurface,
                                    borderColor: colors.border,
                                  }}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 block mb-1.5">
                              Due Date
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { key: 'none', label: 'No date' },
                                { key: 'today', label: 'Today' },
                                { key: 'tomorrow', label: 'Tomorrow' },
                                { key: 'week', label: 'In a week' },
                              ].map((d) => (
                                <button
                                  key={d.key}
                                  onClick={() => setDueQuick(item.id, d.key as any)}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold border"
                                  style={{
                                    backgroundColor: colors.surfaceTertiary,
                                    borderColor: colors.border,
                                  }}
                                >
                                  {d.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 block mb-1.5">
                              Category
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {CATEGORY_OPTIONS.map((cat) => (
                                <button
                                  key={cat}
                                  onClick={() => updateItem(item.id, { category: cat })}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold capitalize border"
                                  style={{
                                    backgroundColor:
                                      item.category === cat ? colors.brandPrimary : 'transparent',
                                    color:
                                      item.category === cat ? colors.onBrandPrimary : colors.onSurface,
                                    borderColor: colors.border,
                                  }}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
