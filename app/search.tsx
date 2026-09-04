import React, { useMemo, useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";
import { TaskRow } from "@/src/components/TaskRow";
import { formatShortDate } from "@/src/utils/date";
import { EmptyState } from "@/src/components/EmptyState";

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data } = useStore();
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return { tasks: [], projects: [], notes: [] };
    return {
      tasks: data.tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description ?? "").toLowerCase().includes(query),
      ),
      projects: data.projects.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.description ?? "").toLowerCase().includes(query),
      ),
      notes: data.notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query),
      ),
    };
  }, [data, query]);

  const totalResults = results.tasks.length + results.projects.length + results.notes.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? spacing.md : insets.top + spacing.sm },
        ]}
      >
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <Icon name="search" size={16} color={colors.muted} />
          <TextInput
            testID="search-input"
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder="Search everything"
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              color: colors.onSurface,
              fontFamily: "PlusJakartaSans-Regular",
              fontSize: 16,
              paddingVertical: 0,
            }}
          />
        </View>
        <Pressable testID="search-close" onPress={() => router.back()} hitSlop={12}>
          <Text weight="medium" color={colors.brandPrimary}>
            Done
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {!query ? (
          <View style={{ paddingTop: spacing.xxl }}>
            <EmptyState
              testID="search-empty"
              icon="search"
              title="Search across NOVA"
              subtitle="Find tasks, projects, and notes instantly."
            />
          </View>
        ) : totalResults === 0 ? (
          <View style={{ paddingTop: spacing.xxl }}>
            <EmptyState testID="search-no-results" icon="search" title="No matches" subtitle="Try a different word." />
          </View>
        ) : (
          <>
            {results.tasks.length > 0 && (
              <SectionHeader label="Tasks" count={results.tasks.length} />
            )}
            {results.tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}

            {results.projects.length > 0 && (
              <SectionHeader label="Projects" count={results.projects.length} />
            )}
            {results.projects.map((p) => (
              <Pressable
                key={p.id}
                testID={`search-project-${p.id}`}
                onPress={() => {
                  router.back();
                  setTimeout(() => router.push({ pathname: "/project/[id]", params: { id: p.id } }), 50);
                }}
                style={[styles.rowItem, { borderColor: colors.divider }]}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.brandTertiary }]}>
                  <Icon name="folder" size={14} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1}>{p.title}</Text>
                  <Text variant="caption" color={colors.muted}>
                    Project
                  </Text>
                </View>
              </Pressable>
            ))}

            {results.notes.length > 0 && (
              <SectionHeader label="Notes" count={results.notes.length} />
            )}
            {results.notes.map((n) => (
              <Pressable
                key={n.id}
                testID={`search-note-${n.id}`}
                onPress={() => {
                  router.back();
                  setTimeout(() => router.push({ pathname: "/note/[id]", params: { id: n.id } }), 50);
                }}
                style={[styles.rowItem, { borderColor: colors.divider }]}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.brandTertiary }]}>
                  <Icon name="edit-3" size={14} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1}>{n.title.trim() || "Untitled"}</Text>
                  <Text variant="caption" color={colors.muted} numberOfLines={1}>
                    {n.body.trim() || formatShortDate(n.updatedAt)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xs, flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="label" color={colors.muted} style={{ letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <Text variant="caption" color={colors.muted}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
