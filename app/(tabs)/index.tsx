import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { useTheme, radius, spacing } from "@/src/theme";
import { useStore } from "@/src/store/store";
import { greetingForNow, isDueToday, isOverdue } from "@/src/utils/date";
import { TaskRow } from "@/src/components/TaskRow";
import { EmptyState } from "@/src/components/EmptyState";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const { data } = useStore();
  const { tasks, projects, notes, settings } = data;

  const todayTasks = useMemo(
    () => tasks.filter((t) => !t.completed && isDueToday(t)),
    [tasks],
  );
  const overdueTasks = useMemo(
    () => tasks.filter((t) => isOverdue(t)),
    [tasks],
  );
  const completedToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.completed && t.completedAt && isDueToday({ ...t, dueDate: t.completedAt } as any),
      ).length,
    [tasks],
  );
  const totalToday = todayTasks.length + completedToday;
  const progress = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const importantTasks = useMemo(
    () => tasks.filter((t) => !t.completed && t.priority === "high").slice(0, 3),
    [tasks],
  );

  const summary = (() => {
    if (overdueTasks.length > 0)
      return `You have ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? "task" : "tasks"}.`;
    if (todayTasks.length === 0) return "Your day is clear. Add something you'd like to accomplish.";
    return `You have ${todayTasks.length} ${todayTasks.length === 1 ? "task" : "tasks"} for today.`;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        testID="home-scroll"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.xxxl + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.muted}>
              {greetingForNow()}
            </Text>
            <Text variant="title" style={{ marginTop: 2 }}>
              {settings.name || "Friend"}
            </Text>
          </View>
          <Pressable
            testID="home-assistant-btn"
            onPress={() => router.push("/assistant")}
            style={[styles.iconBtn, { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary, marginRight: spacing.sm }]}
          >
            <Icon name="zap" size={18} color={colors.onBrandPrimary} />
          </Pressable>
          <Pressable
            testID="home-search-btn"
            onPress={() => router.push("/search")}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Icon name="search" size={18} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Focus card */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <View
            testID="home-focus-card"
            style={[
              styles.focusCard,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <Text variant="caption" color={colors.muted}>
              TODAY'S FOCUS
            </Text>
            <Text variant="heading" style={{ marginTop: spacing.xs }}>
              {summary}
            </Text>
            <View style={styles.progressRow}>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.brandPrimary, width: `${progress}%` },
                  ]}
                />
              </View>
              <Text variant="caption" color={colors.muted}>
                {progress}%
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Capture */}
        <Pressable
          testID="home-quick-capture"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/capture");
          }}
          style={[
            styles.captureBtn,
            { backgroundColor: colors.brandPrimary, marginHorizontal: spacing.xl, marginTop: spacing.lg },
          ]}
        >
          <View style={styles.captureIcon}>
            <Icon name="plus" size={16} color={colors.brandPrimary} />
          </View>
          <Text weight="medium" color={colors.onBrandPrimary} style={{ fontSize: 16 }}>
            What do you need to do?
          </Text>
        </Pressable>

        <Pressable
          testID="home-smart-capture"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/smart-capture");
          }}
          style={[
            styles.smartCaptureBtn,
            {
              backgroundColor: colors.brandTertiary,
              borderColor: colors.brandSecondary,
              marginHorizontal: spacing.xl,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Icon name="zap" size={14} color={colors.brandPrimary} />
          <Text weight="medium" color={colors.onBrandTertiary} style={{ fontSize: 14 }}>
            Smart capture · write naturally
          </Text>
        </Pressable>

        {/* Stats grid */}
        <View style={styles.grid}>
          <StatCard
            testID="home-stat-tasks"
            label="Tasks"
            value={tasks.filter((t) => !t.completed).length}
            icon="check-square"
            onPress={() => router.push("/today")}
          />
          <StatCard
            testID="home-stat-projects"
            label="Projects"
            value={projects.length}
            icon="folder"
            onPress={() => router.push("/projects")}
          />
          <StatCard
            testID="home-stat-notes"
            label="Notes"
            value={notes.length}
            icon="edit-3"
            onPress={() => router.push("/notes")}
          />
          <StatCard
            testID="home-stat-done"
            label="Done"
            value={tasks.filter((t) => t.completed).length}
            icon="check-circle"
            onPress={() => router.push("/today")}
          />
        </View>

        {/* Important */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">Important</Text>
            <Pressable testID="home-view-all-btn" onPress={() => router.push("/today")}>
              <Text variant="label" color={colors.brandPrimary}>
                View all
              </Text>
            </Pressable>
          </View>
        </View>

        {importantTasks.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
            <View
              style={[
                styles.emptyMini,
                { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Text variant="body" color={colors.muted}>
                Nothing marked as high priority.
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: spacing.xs }}>
            {importantTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  onPress,
  testID,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Icon>["name"];
  onPress?: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.stat, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
    >
      <View style={[styles.statIcon, { backgroundColor: colors.brandTertiary }]}>
        <Icon name={icon} size={16} color={colors.brandPrimary} />
      </View>
      <Text variant="title" style={{ marginTop: spacing.md, fontSize: 26 }}>
        {value}
      </Text>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  focusCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  progressRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  captureBtn: {
    height: 60,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  captureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  smartCaptureBtn: {
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  stat: {
    width: "47%",
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  emptyMini: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
});
