import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  TYPE_OPTIONS,
  categoryLabel,
  priorityLabel,
  itemTypeLabel,
  formatShortDate,
  addDays,
} from "@/src/utils/date";

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, updateTask, deleteTask, toggleTask } = useStore();

  const task = useMemo(() => data.tasks.find((t) => t.id === id), [data.tasks, id]);
  const projects = data.projects;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");

  if (!task) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <Text variant="body" color={colors.muted}>Task not found</Text>
      </View>
    );
  }

  const commit = (patch: Partial<typeof task>) => updateTask(task.id, patch);

  const onDelete = () => {
    Alert.alert("Delete task?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const setDueQuick = (key: string) => {
    Haptics.selectionAsync();
    if (key === "none") commit({ dueDate: null });
    else if (key === "today") commit({ dueDate: new Date().toISOString() });
    else if (key === "tomorrow") commit({ dueDate: addDays(new Date(), 1).toISOString() });
    else if (key === "week") commit({ dueDate: addDays(new Date(), 7).toISOString() });
  };

  const dueKey: "none" | "today" | "tomorrow" | "week" | "custom" = !task.dueDate
    ? "none"
    : (() => {
        const d = new Date(task.dueDate);
        const now = new Date();
        const isSame = (a: Date, b: Date) =>
          a.toDateString() === b.toDateString();
        if (isSame(d, now)) return "today";
        if (isSame(d, addDays(now, 1))) return "tomorrow";
        return "custom";
      })();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="task-back" onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={{ flexDirection: "row", gap: spacing.lg }}>
          <Pressable
            testID="task-toggle-btn"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleTask(task.id);
            }}
            hitSlop={12}
          >
            <Icon
              name={task.completed ? "rotate-ccw" : "check-circle"}
              size={22}
              color={colors.onSurface}
            />
          </Pressable>
          <Pressable testID="task-delete" onPress={onDelete} hitSlop={12}>
            <Icon name="trash-2" size={22} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <TextInput
            testID="task-title"
            value={title}
            onChangeText={setTitle}
            onEndEditing={() => commit({ title: title.trim() || task.title })}
            multiline
            placeholder="Task title"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.onSurface,
              fontFamily: "PlusJakartaSans-SemiBold",
              fontSize: 26,
              lineHeight: 34,
              textDecorationLine: task.completed ? "line-through" : "none",
            }}
          />
          <TextInput
            testID="task-description"
            value={description}
            onChangeText={setDescription}
            onEndEditing={() => commit({ description })}
            placeholder="Add a description..."
            placeholderTextColor={colors.muted}
            multiline
            style={{
              color: colors.muted,
              fontFamily: "PlusJakartaSans-Regular",
              fontSize: 16,
              lineHeight: 24,
              marginTop: spacing.md,
              minHeight: 60,
              textAlignVertical: "top",
            }}
          />
        </View>

        <Section label="Type">
          <ChipRow
            options={TYPE_OPTIONS.filter((t) => t !== "project" && t !== "idea")}
            value={task.type}
            onChange={(v) => commit({ type: v })}
            labelFor={itemTypeLabel}
            testIDPrefix="task-type"
          />
        </Section>

        <Section label="Priority">
          <ChipRow
            options={PRIORITY_OPTIONS}
            value={task.priority}
            onChange={(v) => commit({ priority: v })}
            labelFor={priorityLabel}
            testIDPrefix="task-priority"
          />
        </Section>

        <Section label={`Due · ${task.dueDate ? formatShortDate(task.dueDate) : "None"}`}>
          <ChipRow
            options={["none", "today", "tomorrow", "week"] as const}
            value={dueKey === "custom" ? "none" : (dueKey as any)}
            onChange={(v) => setDueQuick(v)}
            labelFor={(k) => (k === "none" ? "None" : k === "week" ? "In a week" : k.charAt(0).toUpperCase() + k.slice(1))}
            testIDPrefix="task-due"
          />
        </Section>

        <Section label="Category">
          <ChipRow
            options={CATEGORY_OPTIONS}
            value={task.category}
            onChange={(v) => commit({ category: v })}
            labelFor={categoryLabel}
            testIDPrefix="task-category"
          />
        </Section>

        {projects.length > 0 ? (
          <Section label="Project">
            <ChipRow
              options={["none", ...projects.map((p) => p.id)] as any}
              value={(task.projectId ?? "none") as any}
              onChange={(v: any) => commit({ projectId: v === "none" ? null : v })}
              labelFor={(v: any) => (v === "none" ? "None" : projects.find((p) => p.id === v)?.title ?? "")}
              testIDPrefix="task-project"
            />
          </Section>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text
        variant="label"
        color={colors.muted}
        style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm, letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
});
