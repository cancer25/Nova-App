import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { storage } from "@/src/utils/storage";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";
import {
  AssistantAction,
  buildContext,
  ChatMsg,
  describeAction,
  extractActions,
} from "@/src/assistant/protocol";
import { streamAssistant } from "@/src/assistant/client";

const CHAT_KEY = "nova.chat.v1";
const SESSION_KEY = "nova.chat.session.v1";

const SUGGESTIONS: { label: string; prompt: string; icon: React.ComponentProps<typeof Icon>["name"] }[] = [
  { label: "Plan my day", prompt: "Help me plan today. What should I focus on?", icon: "sun" },
  { label: "Plan this week", prompt: "Help me plan the rest of this week.", icon: "calendar" },
  { label: "Organize my tasks", prompt: "Look at my tasks and suggest a cleaner priority + due-date setup.", icon: "layers" },
  { label: "Break down a goal", prompt: "I want to break a goal into smaller tasks. Ask me what the goal is.", icon: "target" },
];

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Assistant() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hydratedRef = useRef(false);

  // Load persisted chat + session
  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<ChatMsg[] | null>(CHAT_KEY, null);
      const sid = await storage.getItem<string | null>(SESSION_KEY, null);
      if (Array.isArray(stored)) setMessages(stored);
      if (typeof sid === "string" && sid) setSessionId(sid);
      else {
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

  // Persist chat on every change (after hydration)
  useEffect(() => {
    if (!hydratedRef.current) return;
    storage.setItem(CHAT_KEY, messages);
  }, [messages]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const send = useCallback(
    async (userText: string) => {
      const text = userText.trim();
      if (!text || streaming || !sessionId) return;

      const userMsg: ChatMsg = {
        id: newId(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };
      const asstId = newId();
      const asstMsg: ChatMsg = {
        id: asstId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((cur) => [...cur, userMsg, asstMsg]);
      setInput("");
      setStreaming(true);
      Haptics.selectionAsync();
      scrollToEnd();

      const context = buildContext(data.tasks, data.projects, data.notes, data.settings.name);
      const historyForServer = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let buffer = "";

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
              cur.map((m) => (m.id === asstId ? { ...m, content: proseSoFar } : m)),
            );
            scrollToEnd();
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
                  : m,
              ),
            );
            setStreaming(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            scrollToEnd();
          },
          onError: (err) => {
            if (!err) {
              setStreaming(false);
              return;
            }
            setMessages((cur) =>
              cur.map((m) =>
                m.id === asstId
                  ? { ...m, content: err, error: true }
                  : m,
              ),
            );
            setStreaming(false);
            scrollToEnd();
          },
        },
      );
    },
    [data, messages, sessionId, streaming, scrollToEnd],
  );

  const applyActions = useCallback(
    (msgId: string, actions: AssistantAction[]) => {
      const runAll = () => {
        for (const a of actions) {
          switch (a.type) {
            case "create_task":
              addTask({
                title: a.title,
                priority: a.priority ?? "normal",
                category: a.category ?? "personal",
                dueDate: a.dueDate ?? null,
                projectId: a.projectId ?? null,
              });
              break;
            case "update_task":
              updateTask(a.id, a.patch);
              break;
            case "complete_task": {
              const t = data.tasks.find((tt) => tt.id === a.id);
              if (t && !t.completed) toggleTask(a.id);
              break;
            }
            case "delete_task":
              deleteTask(a.id);
              break;
            case "create_project":
              addProject({ title: a.title, category: a.category ?? "personal" });
              break;
            case "delete_project":
              deleteProject(a.id);
              break;
          }
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessages((cur) => cur.map((m) => (m.id === msgId ? { ...m, actionsApplied: true } : m)));
      };
      const destructive = actions.some((a) => a.type === "delete_task" || a.type === "delete_project");
      if (destructive) {
        if (Platform.OS === "web") {
          const ok = typeof window !== "undefined" && window.confirm("Some of these actions permanently delete items. Apply?");
          if (ok) runAll();
          return;
        }
        Alert.alert(
          "Apply changes?",
          "Some of these actions permanently delete items.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Apply", style: "destructive", onPress: runAll },
          ],
        );
      } else {
        runAll();
      }
    },
    [data.tasks, addTask, updateTask, toggleTask, deleteTask, addProject, deleteProject],
  );

  const discardActions = (msgId: string) => {
    Haptics.selectionAsync();
    setMessages((cur) => cur.map((m) => (m.id === msgId ? { ...m, actionsDiscarded: true } : m)));
  };

  const clearChat = () => {
    const confirmClear = () => {
      setMessages([]);
      const s = newId();
      setSessionId(s);
      storage.setItem(SESSION_KEY, s);
    };
    if (Platform.OS === "web") {
      const ok = typeof window !== "undefined" && window.confirm("Clear this conversation?");
      if (ok) confirmClear();
      return;
    }
    Alert.alert("Clear this conversation?", "The messages in NOVA's AI assistant will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: confirmClear },
    ]);
  };

  const empty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider }]}>
        <Pressable testID="assistant-back" onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerTitle}>
          <View style={[styles.brandDot, { backgroundColor: colors.brandPrimary }]}>
            <Icon name="zap" size={12} color={colors.onBrandPrimary} />
          </View>
          <View>
            <Text weight="semibold" style={{ fontSize: 17 }}>Ask NOVA</Text>
            <Text variant="caption" color={colors.muted}>
              {streaming ? "Thinking..." : "AI assistant"}
            </Text>
          </View>
        </View>
        <Pressable testID="assistant-clear" onPress={clearChat} hitSlop={12} disabled={empty}>
          <Icon name="rotate-ccw" size={20} color={empty ? colors.muted : colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md }}
        onContentSizeChange={scrollToEnd}
      >
        {empty ? (
          <View style={styles.introWrap}>
            <View style={[styles.introIcon, { backgroundColor: colors.brandTertiary }]}>
              <Icon name="zap" size={26} color={colors.brandPrimary} />
            </View>
            <Text variant="title" style={{ textAlign: "center", marginTop: spacing.lg }}>
              Ask NOVA anything
            </Text>
            <Text
              variant="body"
              color={colors.muted}
              style={{ textAlign: "center", marginTop: spacing.sm, maxWidth: 300 }}
            >
              Plan your day, break down goals, or reorganize your tasks. Nothing changes without your approval.
            </Text>
          </View>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              onApply={() => m.actions && applyActions(m.id, m.actions)}
              onDiscard={() => discardActions(m.id)}
              tasks={data.tasks}
              projects={data.projects}
              streaming={streaming && m.id === messages[messages.length - 1]?.id && m.role === "assistant"}
            />
          ))
        )}
      </ScrollView>

      {/* Suggestions row (only when empty) */}
      {empty ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md }}
        >
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.label}
              testID={`assistant-suggestion-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
              onPress={() => send(s.prompt)}
              style={[
                styles.suggestion,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              ]}
            >
              <Icon name={s.icon} size={14} color={colors.brandPrimary} />
              <Text weight="medium" style={{ fontSize: 14 }}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Composer */}
      <View
        style={[
          styles.composer,
          {
            paddingBottom: insets.bottom + spacing.sm,
            borderTopColor: colors.divider,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <TextInput
            testID="assistant-input"
            value={input}
            onChangeText={setInput}
            placeholder={streaming ? "NOVA is replying..." : "Message NOVA"}
            placeholderTextColor={colors.muted}
            multiline
            editable={!streaming}
            style={{
              flex: 1,
              color: colors.onSurface,
              fontFamily: "PlusJakartaSans-Regular",
              fontSize: 16,
              maxHeight: 120,
              paddingTop: 10,
              paddingBottom: 10,
            }}
          />
          <Pressable
            testID="assistant-send"
            onPress={() => (streaming ? abortRef.current?.abort() : send(input))}
            disabled={!streaming && !input.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  streaming || input.trim() ? colors.brandPrimary : colors.surfaceTertiary,
              },
            ]}
          >
            {streaming ? (
              <Icon name="square" size={14} color={colors.onBrandPrimary} />
            ) : (
              <Icon name="arrow-up" size={16} color={input.trim() ? colors.onBrandPrimary : colors.muted} />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  msg,
  onApply,
  onDiscard,
  tasks,
  projects,
  streaming,
}: {
  msg: ChatMsg;
  onApply: () => void;
  onDiscard: () => void;
  tasks: any[];
  projects: any[];
  streaming: boolean;
}) {
  const { colors } = useTheme();
  const isUser = msg.role === "user";
  return (
    <View style={{ alignItems: isUser ? "flex-end" : "flex-start" }}>
      <View
        testID={`assistant-msg-${msg.id}`}
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.brandPrimary, borderTopRightRadius: 4 }
            : {
                backgroundColor: msg.error ? colors.surfaceTertiary : colors.surfaceSecondary,
                borderTopLeftRadius: 4,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: msg.error ? colors.error : colors.border,
              },
        ]}
      >
        {msg.content ? (
          <Text
            style={{ fontSize: 15, lineHeight: 22 }}
            color={
              isUser
                ? colors.onBrandPrimary
                : msg.error
                  ? colors.error
                  : colors.onSurfaceSecondary
            }
          >
            {msg.content}
          </Text>
        ) : streaming ? (
          <TypingDots color={colors.muted} />
        ) : null}
      </View>

      {msg.actions && msg.actions.length > 0 && !msg.actionsDiscarded ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.xs, width: "100%" }}>
          {msg.actions.map((a, i) => {
            const d = describeAction(a, { tasks, projects });
            return (
              <View
                key={i}
                testID={`assistant-action-${msg.id}-${i}`}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: d.destructive ? colors.error : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: d.destructive ? colors.surfaceTertiary : colors.brandTertiary },
                  ]}
                >
                  <Icon
                    name={d.icon}
                    size={14}
                    color={d.destructive ? colors.error : colors.brandPrimary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="medium" style={{ fontSize: 14 }} numberOfLines={2}>
                    {d.title}
                  </Text>
                  {d.subtitle ? (
                    <Text variant="caption" color={colors.muted} numberOfLines={2}>
                      {d.subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
          {msg.actionsApplied ? (
            <View style={[styles.appliedRow, { backgroundColor: colors.brandTertiary }]}>
              <Icon name="check-circle" size={14} color={colors.brandPrimary} />
              <Text variant="caption" color={colors.brandPrimary} weight="medium">
                Applied
              </Text>
            </View>
          ) : (
            <View style={styles.actionButtonsRow}>
              <Pressable
                testID={`assistant-discard-${msg.id}`}
                onPress={onDiscard}
                style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <Text weight="medium" color={colors.onSurface}>
                  Discard
                </Text>
              </Pressable>
              <Pressable
                testID={`assistant-apply-${msg.id}`}
                onPress={onApply}
                style={[styles.actionBtn, { backgroundColor: colors.brandPrimary, flex: 1 }]}
              >
                <Text weight="semibold" color={colors.onBrandPrimary}>
                  Apply {msg.actions.length}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function TypingDots({ color }: { color: string }) {
  const anims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  useEffect(() => {
    const loops = anims.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(300),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);
  return (
    <View style={{ flexDirection: "row", gap: 4, paddingVertical: 6 }}>
      {anims.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  brandDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  introWrap: { alignItems: "center", paddingTop: spacing.xxxl, paddingHorizontal: spacing.lg },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
  },
  composer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    minHeight: 48,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bubble: {
    maxWidth: "88%",
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  actionButtonsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: {
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
});
