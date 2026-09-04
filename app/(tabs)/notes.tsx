import React, { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { EmptyState } from "@/src/components/EmptyState";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";
import { formatShortDate } from "@/src/utils/date";

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, addNote } = useStore();
  const { notes } = data;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const create = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const n = addNote({ body: "" });
    router.push({ pathname: "/note/[id]", params: { id: n.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.xxxl + 80,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              QUICK THOUGHTS
            </Text>
            <Text variant="display" style={{ marginTop: spacing.xs }}>
              Notes
            </Text>
          </View>
          <Pressable
            testID="notes-add"
            onPress={create}
            style={[styles.addBtn, { backgroundColor: colors.brandPrimary }]}
          >
            <Icon name="plus" size={20} color={colors.onBrandPrimary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <Icon name="search" size={16} color={colors.muted} />
            <TextInput
              testID="notes-search"
              value={query}
              onChangeText={setQuery}
              placeholder="Search notes"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                color: colors.onSurface,
                fontFamily: "PlusJakartaSans-Regular",
                fontSize: 15,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={{ paddingTop: spacing.xxl }}>
            <EmptyState
              testID="notes-empty"
              icon="edit-3"
              title={notes.length === 0 ? "No notes yet" : "No matches"}
              subtitle={
                notes.length === 0
                  ? "Capture a thought, an idea, or something worth remembering."
                  : "Try a different search."
              }
              actionLabel={notes.length === 0 ? "New note" : undefined}
              onAction={notes.length === 0 ? create : undefined}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.md }}>
            {filtered.map((n) => (
              <Pressable
                key={n.id}
                testID={`note-card-${n.id}`}
                onPress={() => router.push({ pathname: "/note/[id]", params: { id: n.id } })}
                style={[
                  styles.noteCard,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <Text variant="heading" numberOfLines={1}>
                  {n.title.trim() || "Untitled"}
                </Text>
                {n.body.trim() ? (
                  <Text variant="body" color={colors.muted} numberOfLines={3} style={{ marginTop: spacing.xs }}>
                    {n.body}
                  </Text>
                ) : null}
                <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.md }}>
                  {formatShortDate(n.updatedAt)}
                </Text>
              </Pressable>
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  noteCard: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
});
