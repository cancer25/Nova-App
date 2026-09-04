import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { ChipRow } from "@/src/components/ChipRow";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  categoryLabel,
  priorityLabel,
  formatShortDate,
  addDays,
} from "@/src/utils/date";
import type { Category, Priority } from "@/src/store/types";
import { defaultParser, ParsedItem } from "@/src/smart/parser";
import { MicButton } from "@/src/components/MicButton";
import { getSpeechService, SpeechError } from "@/src/speech/service";

const EXAMPLES = [
  "Study for math exam tomorrow, it's urgent",
  "Buy groceries and call mom this evening",
  "Prepare presentation for the client meeting on Monday",
  "Gym workout tonight and yoga on Sunday",
];

function mapErrorMessage(err: SpeechError): string {
  switch (err.code) {
    case "permission-denied":
      return "Microphone permission was denied. Enable it in system settings to use voice.";
    case "not-available":
      return Platform.OS === "web"
        ? "Voice input isn't supported in this browser. Try Chrome or Safari."
        : "Voice input needs a real device build. It won't work in Expo Go.";
    case "no-speech":
      return "We didn't catch that. Try again a bit closer to the microphone.";
    case "network":
      return "Speech recognition needs an internet connection.";
    case "aborted":
      return "";
    default:
      return err.message || "Something went wrong with voice input.";
  }
}

export default function SmartCapture() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { addTask } = useStore();

  const [input, setInput] = useState("");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Voice capture ----------
  const speech = useMemo(() => getSpeechService(), []);
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const inputBeforeListenRef = useRef("");
  const listeningRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    speech.isAvailable().then((v) => {
      if (mounted) setVoiceSupported(v);
    });
    return () => {
      mounted = false;
      // Best-effort stop if unmounting mid-listen
      speech.stop().catch(() => {});
    };
  }, [speech]);

  const stopListening = async () => {
    if (!listeningRef.current) return;
    await speech.stop();
  };

  const startListening = async () => {
    if (listeningRef.current) {
      await stopListening();
      return;
    }
    setVoiceMessage(null);
    if (!voiceSupported) {
      setVoiceMessage(
        Platform.OS === "web"
          ? "Voice input isn't supported in this browser. Try Chrome or Safari."
          : "Voice input needs a real device build. It won't work in Expo Go.",
      );
      return;
    }
    const granted = await speech.requestPermission();
    if (!granted) {
      setVoiceMessage("Microphone permission was denied. Enable it in system settings to use voice.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    inputBeforeListenRef.current = input.trim();
    listeningRef.current = true;
    setListening(true);
    setVoiceMessage(null);

    await speech.start({
      onResult: ({ transcript }) => {
        const base = inputBeforeListenRef.current;
        const joined = base ? `${base} ${transcript}` : transcript;
        setInput(joined);
      },
      onError: (err: SpeechError) => {
        setVoiceMessage(mapErrorMessage(err));
      },
      onEnd: () => {
        listeningRef.current = false;
        setListening(false);
        Haptics.selectionAsync();
      },
    });
  };
  // ----------------------------------

  // Debounced live parsing
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
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  const canSave = items.length > 0;

  const saveAll = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    items.forEach((it) => {
      addTask({
        title: it.title,
        priority: it.priority,
        category: it.category,
        dueDate: it.dueDate,
      });
    });
    router.back();
  };

  const updateItem = (id: string, patch: Partial<ParsedItem>) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    Haptics.selectionAsync();
    setItems((cur) => cur.filter((i) => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const setDueQuick = (id: string, key: "none" | "today" | "tomorrow" | "week") => {
    let dueDate: string | null = null;
    if (key === "today") dueDate = new Date().toISOString();
    else if (key === "tomorrow") dueDate = addDays(new Date(), 1).toISOString();
    else if (key === "week") dueDate = addDays(new Date(), 7).toISOString();
    updateItem(id, { dueDate });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      {/* Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === "ios" ? spacing.md : insets.top + spacing.sm },
        ]}
      >
        <Pressable testID="smart-close" onPress={() => router.back()} hitSlop={12}>
          <Text variant="body" color={colors.muted}>
            Cancel
          </Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Icon name="zap" size={16} color={colors.brandPrimary} />
          <Text weight="medium">Smart capture</Text>
        </View>
        <Pressable testID="smart-save" onPress={saveAll} disabled={!canSave} hitSlop={12}>
          <Text weight="semibold" color={canSave ? colors.brandPrimary : colors.muted}>
            {canSave ? `Save ${items.length}` : "Save"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <View style={styles.inputRow}>
            <TextInput
              testID="smart-input"
              value={input}
              onChangeText={setInput}
              placeholder={listening ? "Listening..." : "Type or speak what's on your mind..."}
              placeholderTextColor={colors.muted}
              multiline
              autoFocus
              editable={!listening}
              style={{
                flex: 1,
                color: colors.onSurface,
                fontFamily: "PlusJakartaSans-Medium",
                fontSize: 20,
                lineHeight: 28,
                minHeight: 110,
                textAlignVertical: "top",
                paddingRight: spacing.md,
              }}
            />
            <MicButton
              testID="smart-mic"
              active={listening}
              disabled={voiceSupported === null}
              onPress={startListening}
            />
          </View>
          {voiceMessage ? (
            <View
              testID="smart-voice-message"
              style={[
                styles.voiceMsg,
                { backgroundColor: colors.surfaceTertiary, borderColor: colors.border },
              ]}
            >
              <Icon name="alert-circle" size={12} color={colors.warning} />
              <Text variant="caption" color={colors.onSurface} style={{ flex: 1 }}>
                {voiceMessage}
              </Text>
            </View>
          ) : null}
          <View style={styles.hintRow}>
            <Icon
              name={listening ? "mic" : "zap"}
              size={12}
              color={listening ? colors.error : colors.brandPrimary}
            />
            <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
              {listening
                ? "Speak naturally — tap the stop button when you're done."
                : "NOVA turns natural language into tasks. Try adding \"tomorrow\", \"urgent\", or list several with new lines."}
            </Text>
          </View>
        </View>

        {input.trim().length === 0 ? (
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
            <Text
              variant="label"
              color={colors.muted}
              style={{ letterSpacing: 0.5, marginBottom: spacing.md }}
            >
              TRY AN EXAMPLE
            </Text>
            <View style={{ gap: spacing.sm }}>
              {EXAMPLES.map((ex) => (
                <Pressable
                  key={ex}
                  testID={`smart-example-${EXAMPLES.indexOf(ex)}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setInput(ex);
                  }}
                  style={[
                    styles.example,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <Text variant="body" color={colors.onSurface}>
                    {ex}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
            <View style={styles.previewHeader}>
              <Text variant="label" color={colors.muted} style={{ letterSpacing: 0.5 }}>
                {parsing
                  ? "READING..."
                  : items.length === 0
                    ? "NO TASKS DETECTED"
                    : `${items.length} ${items.length === 1 ? "TASK" : "TASKS"} FOUND`}
              </Text>
              {parsing ? <Dot color={colors.brandPrimary} /> : null}
            </View>
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {items.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  expanded={expandedId === it.id}
                  onToggleExpand={() => setExpandedId((cur) => (cur === it.id ? null : it.id))}
                  onChange={(patch) => updateItem(it.id, patch)}
                  onRemove={() => removeItem(it.id)}
                  onDueQuick={(k) => setDueQuick(it.id, k)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ItemCard({
  item,
  expanded,
  onToggleExpand,
  onChange,
  onRemove,
  onDueQuick,
}: {
  item: ParsedItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (patch: Partial<ParsedItem>) => void;
  onRemove: () => void;
  onDueQuick: (k: "none" | "today" | "tomorrow" | "week") => void;
}) {
  const { colors } = useTheme();
  const [editingTitle, setEditingTitle] = useState(item.title);

  useEffect(() => {
    setEditingTitle(item.title);
  }, [item.title]);

  const priorityColor =
    item.priority === "high"
      ? colors.error
      : item.priority === "low"
        ? colors.muted
        : colors.info;

  return (
    <View
      testID={`smart-item-${item.id}`}
      style={[
        styles.card,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.zapIcon, { backgroundColor: colors.brandTertiary }]}>
          <Icon name="check-square" size={14} color={colors.brandPrimary} />
        </View>
        <TextInput
          testID={`smart-item-title-${item.id}`}
          value={editingTitle}
          onChangeText={setEditingTitle}
          onEndEditing={() => onChange({ title: editingTitle.trim() || item.title })}
          multiline
          style={{
            flex: 1,
            color: colors.onSurface,
            fontFamily: "PlusJakartaSans-Medium",
            fontSize: 16,
            lineHeight: 22,
            paddingVertical: 0,
          }}
        />
        <Pressable
          testID={`smart-item-remove-${item.id}`}
          hitSlop={12}
          onPress={onRemove}
          style={{ paddingLeft: spacing.sm }}
        >
          <Icon name="x" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <MetaChip
          label={priorityLabel(item.priority)}
          color={priorityColor}
          detected={item.detected.priority}
        />
        <MetaChip label={categoryLabel(item.category)} detected={item.detected.category} />
        {item.dueDate ? (
          <MetaChip
            label={formatShortDate(item.dueDate)}
            icon="calendar"
            detected={item.detected.dueDate}
          />
        ) : null}
        <Pressable
          testID={`smart-item-expand-${item.id}`}
          onPress={onToggleExpand}
          hitSlop={8}
          style={styles.editBtn}
        >
          <Icon name={expanded ? "chevron-up" : "sliders"} size={12} color={colors.muted} />
          <Text variant="caption" color={colors.muted}>
            {expanded ? "Close" : "Edit"}
          </Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={{ marginTop: spacing.md, marginHorizontal: -spacing.lg }}>
          <SectionLabel>Priority</SectionLabel>
          <ChipRow
            options={PRIORITY_OPTIONS}
            value={item.priority}
            onChange={(v: Priority) => onChange({ priority: v })}
            labelFor={priorityLabel}
            testIDPrefix={`smart-item-${item.id}-priority`}
          />
          <SectionLabel>Category</SectionLabel>
          <ChipRow
            options={CATEGORY_OPTIONS}
            value={item.category}
            onChange={(v: Category) => onChange({ category: v })}
            labelFor={categoryLabel}
            testIDPrefix={`smart-item-${item.id}-category`}
          />
          <SectionLabel>Due</SectionLabel>
          <ChipRow
            options={["none", "today", "tomorrow", "week"] as const}
            value={
              !item.dueDate
                ? "none"
                : (() => {
                    const d = new Date(item.dueDate);
                    const now = new Date();
                    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
                    if (same(d, now)) return "today";
                    if (same(d, addDays(now, 1))) return "tomorrow";
                    return "none";
                  })()
            }
            onChange={(v) => onDueQuick(v)}
            labelFor={(k) =>
              k === "none" ? "None" : k === "week" ? "In a week" : k.charAt(0).toUpperCase() + k.slice(1)
            }
            testIDPrefix={`smart-item-${item.id}-due`}
          />
        </View>
      ) : null}
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text
      variant="caption"
      color={colors.muted}
      style={{
        paddingHorizontal: spacing.xl,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        letterSpacing: 0.5,
      }}
    >
      {String(children).toUpperCase()}
    </Text>
  );
}

function MetaChip({
  label,
  icon,
  color,
  detected,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Icon>["name"];
  color?: string;
  detected?: boolean;
}) {
  const { colors } = useTheme();
  const bg = detected ? colors.brandTertiary : colors.surfaceTertiary;
  const fg = detected ? colors.brandPrimary : color ?? colors.muted;
  return (
    <View style={[styles.metaChip, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={11} color={fg} /> : null}
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </View>
  );
}

function Dot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity }} />;
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  voiceMsg: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  example: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  zapIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
    alignItems: "center",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});
