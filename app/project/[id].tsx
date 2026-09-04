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
import { CATEGORY_OPTIONS, categoryLabel } from "@/src/utils/date";
import { TaskRow } from "@/src/components/TaskRow";

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, updateProject, deleteProject, addTask } = useStore();

  const project = useMemo(() => data.projects.find((p) => p.id === id), [data.projects, id]);
  const projectTasks = useMemo(
    () => data.tasks.filter((t) => t.projectId === id),
    [data.tasks, id],
  );

  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [newTask, setNewTask] = useState("");

  if (!project) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <Text variant="body" color={colors.muted}>Project not found</Text>
      </View>
    );
  }

  const done = projectTasks.filter((t) => t.completed).length;
  const total = projectTasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const addTaskInline = () => {
    if (!newTask.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addTask({ title: newTask.trim(), projectId: project.id, category: project.category });
    setNewTask("");
  };

  const onDelete = () => {
    Alert.alert("Delete project?", "Tasks will remain, but will no longer be linked to a project.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteProject(project.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="project-back" onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Pressable testID="project-delete" onPress={onDelete} hitSlop={12}>
          <Icon name="trash-2" size={22} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        <View style={{ paddingHorizontal: spacing.xl }}>
          <TextInput
            testID="project-title"
            value={title}
            onChangeText={setTitle}
            onEndEditing={() => updateProject(project.id, { title: title.trim() || project.title })}
            placeholder="Project title"
            placeholderTextColor={colors.muted}
            multiline
            style={{
              color: colors.onSurface,
              fontFamily: "PlusJakartaSans-SemiBold",
              fontSize: 28,
              lineHeight: 36,
            }}
          />
          <TextInput
            testID="project-description"
            value={description}
            onChangeText={setDescription}
            onEndEditing={() => updateProject(project.id, { description })}
            placeholder="Describe this project..."
            placeholderTextColor={colors.muted}
            multiline
            style={{
              color: colors.muted,
              fontFamily: "PlusJakartaSans-Regular",
              fontSize: 16,
              lineHeight: 24,
              marginTop: spacing.md,
              minHeight: 40,
              textAlignVertical: "top",
            }}
          />

          <View style={styles.progressRow}>
            <View style={[styles.track, { backgroundColor: colors.surfaceTertiary }]}>
              <View
                style={[styles.fill, { backgroundColor: colors.brandPrimary, width: `${pct}%` }]}
              />
            </View>
            <Text variant="caption" color={colors.muted}>
              {done}/{total}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Text
            variant="label"
            color={colors.muted}
            style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm, letterSpacing: 0.5 }}
          >
            CATEGORY
          </Text>
          <ChipRow
            options={CATEGORY_OPTIONS}
            value={project.category}
            onChange={(v) => updateProject(project.id, { category: v })}
            labelFor={categoryLabel}
            testIDPrefix="project-category"
          />
        </View>

        <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl }}>
          <Text
            variant="label"
            color={colors.muted}
            style={{ marginBottom: spacing.sm, letterSpacing: 0.5 }}
          >
            TASKS
          </Text>
          <View
            style={[
              styles.addTaskRow,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <Icon name="plus" size={18} color={colors.muted} />
            <TextInput
              testID="project-add-task-input"
              value={newTask}
              onChangeText={setNewTask}
              onSubmitEditing={addTaskInline}
              returnKeyType="done"
              placeholder="Add a task"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                color: colors.onSurface,
                fontFamily: "PlusJakartaSans-Regular",
                fontSize: 16,
                paddingVertical: 0,
              }}
            />
            {newTask.trim() ? (
              <Pressable testID="project-add-task-btn" onPress={addTaskInline}>
                <Text weight="semibold" color={colors.brandPrimary}>
                  Add
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: spacing.md }}>
          {projectTasks.length === 0 ? (
            <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xl }}>
              <Text variant="body" color={colors.muted} style={{ textAlign: "center" }}>
                No tasks yet. Add your first step above.
              </Text>
            </View>
          ) : (
            projectTasks.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  progressRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%" },
  addTaskRow: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
