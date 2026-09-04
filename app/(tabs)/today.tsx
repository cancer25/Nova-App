import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Text } from "@/src/components/Text";
import { TaskRow } from "@/src/components/TaskRow";
import { EmptyState } from "@/src/components/EmptyState";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";
import { isDueToday, isOverdue, priorityRank, isDueTomorrow, isDueThisWeek } from "@/src/utils/date";
import { Icon } from "@/src/components/Icon";

type Section = { key: string; title: string; data: any[] };

export default function Today() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const { data } = useStore();
  const { tasks } = data;

  const sections: Section[] = useMemo(() => {
    const overdue = tasks.filter((t) => isOverdue(t));
    const today = tasks
      .filter((t) => !t.completed && isDueToday(t))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    const tomorrow = tasks
      .filter((t) => !t.completed && isDueTomorrow(t))
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    const upcoming = tasks
      .filter((t) => !t.completed && isDueThisWeek(t))
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    const noDate = tasks.filter((t) => !t.completed && !t.dueDate);
    const completed = tasks
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
      .slice(0, 20);

    const list: Section[] = [];
    if (overdue.length) list.push({ key: "overdue", title: "Overdue", data: overdue });
    if (today.length) list.push({ key: "today", title: "Today", data: today });
    if (tomorrow.length) list.push({ key: "tomorrow", title: "Tomorrow", data: tomorrow });
    if (upcoming.length) list.push({ key: "upcoming", title: "Upcoming", data: upcoming });
    if (noDate.length) list.push({ key: "unscheduled", title: "Unscheduled", data: noDate });
    if (completed.length) list.push({ key: "completed", title: "Completed", data: completed });
    return list;
  }, [tasks]);

  const total = tasks.filter((t) => !t.completed && (isDueToday(t) || isOverdue(t))).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.xxxl + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
          <Text variant="caption" color={colors.muted}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Text variant="display" style={{ marginTop: spacing.xs }}>
              Today
            </Text>
            <Pressable
              testID="today-add-task"
              onPress={() => router.push("/capture")}
              style={[styles.addBtn, { backgroundColor: colors.brandPrimary }]}
            >
              <Icon name="plus" size={20} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
          <Text variant="body" color={colors.muted} style={{ marginTop: spacing.xs }}>
            {total === 0 ? "Nothing due today." : `${total} to complete`}
          </Text>
        </View>

        {sections.length === 0 ? (
          <View style={{ paddingTop: spacing.xxl }}>
            <EmptyState
              testID="today-empty"
              icon="sun"
              title="All caught up for today"
              subtitle="Add something you want to accomplish."
              actionLabel="Add task"
              onAction={() => router.push("/capture")}
            />
          </View>
        ) : (
          <View style={{ marginTop: spacing.lg }}>
            {sections.map((s) => (
              <View key={s.key} style={{ marginTop: spacing.md }}>
                <View style={styles.sectionHeader}>
                  <Text variant="label" color={colors.muted} style={{ letterSpacing: 0.5 }}>
                    {s.title.toUpperCase()}
                  </Text>
                  <Text variant="caption" color={colors.muted}>
                    {s.data.length}
                  </Text>
                </View>
                <View>
                  {s.data.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
});
