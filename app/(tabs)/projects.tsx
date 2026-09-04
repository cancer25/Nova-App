import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { EmptyState } from "@/src/components/EmptyState";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, addProject } = useStore();
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

  const create = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const p = addProject({ title: "Untitled project", category: "personal" });
    router.push({ pathname: "/project/[id]", params: { id: p.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.xxxl + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            paddingHorizontal: spacing.xl,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text variant="caption" color={colors.muted}>
              GROUP RELATED WORK
            </Text>
            <Text variant="display" style={{ marginTop: spacing.xs }}>
              Projects
            </Text>
          </View>
          <Pressable
            testID="projects-add"
            onPress={create}
            style={[styles.addBtn, { backgroundColor: colors.brandPrimary }]}
          >
            <Icon name="plus" size={20} color={colors.onBrandPrimary} />
          </Pressable>
        </View>

        {projects.length === 0 ? (
          <View style={{ paddingTop: spacing.xxl }}>
            <EmptyState
              testID="projects-empty"
              icon="folder"
              title="No projects yet"
              subtitle="Group related tasks together, like a trip or a launch."
              actionLabel="Create project"
              onAction={create}
            />
          </View>
        ) : (
          <View style={styles.grid}>
            {projects.map((p) => {
              const s = stats.get(p.id) ?? { total: 0, done: 0 };
              const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <Pressable
                  key={p.id}
                  testID={`project-card-${p.id}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/project/[id]", params: { id: p.id } });
                  }}
                  style={[
                    styles.card,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: colors.brandTertiary }]}>
                    <Icon name="folder" size={16} color={colors.brandPrimary} />
                  </View>
                  <Text variant="heading" numberOfLines={2} style={{ marginTop: spacing.md }}>
                    {p.title}
                  </Text>
                  <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                    {s.total === 0
                      ? "No tasks"
                      : `${s.done}/${s.total} ${s.total === 1 ? "task" : "tasks"}`}
                  </Text>
                  <View
                    style={[styles.progressTrack, { backgroundColor: colors.surfaceTertiary }]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.brandPrimary, width: `${pct}%` },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  card: {
    width: "47%",
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 150,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  progressFill: { height: "100%" },
});
