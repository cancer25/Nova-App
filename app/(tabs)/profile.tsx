import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";
import { ChipRow } from "@/src/components/ChipRow";
import type { Priority } from "@/src/store/types";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, updateSettings, resetAll } = useStore();
  const { settings, tasks, projects, notes } = data;
  const [editingName, setEditingName] = useState(settings.name);

  const onReset = () => {
    Alert.alert(
      "Clear all data?",
      "This deletes every task, project, and note. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetAll();
          },
        },
      ],
    );
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
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text variant="caption" color={colors.muted}>
            YOU
          </Text>
          <Text variant="display" style={{ marginTop: spacing.xs }}>
            Profile
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, { backgroundColor: colors.brandTertiary }]}>
                <Text variant="title" color={colors.brandPrimary}>
                  {(settings.name || "N").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={colors.muted}>
                  Name
                </Text>
                <TextInput
                  testID="profile-name-input"
                  value={editingName}
                  onChangeText={setEditingName}
                  onEndEditing={() => updateSettings({ name: editingName.trim() || "Friend" })}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  style={{
                    color: colors.onSurface,
                    fontFamily: "PlusJakartaSans-Medium",
                    fontSize: 18,
                    paddingVertical: 4,
                  }}
                />
              </View>
            </View>
            <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
              <Stat label="Tasks" value={tasks.length} />
              <Stat label="Done" value={tasks.filter((t) => t.completed).length} />
              <Stat label="Projects" value={projects.length} />
              <Stat label="Notes" value={notes.length} />
            </View>
          </View>
        </View>

        <Section title="Appearance">
          <ChipRow
            options={["system", "light", "dark"] as const}
            value={settings.themePref}
            onChange={(v) => {
              Haptics.selectionAsync();
              updateSettings({ themePref: v });
            }}
            labelFor={(v) => (v === "system" ? "System" : v === "light" ? "Light" : "Dark")}
            testIDPrefix="theme"
          />
        </Section>

        <Section title="Default task priority">
          <ChipRow
            options={["low", "normal", "high"] as const}
            value={settings.defaultPriority}
            onChange={(v: Priority) => {
              Haptics.selectionAsync();
              updateSettings({ defaultPriority: v });
            }}
            labelFor={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            testIDPrefix="default-priority"
          />
        </Section>

        <Section title="Notifications">
          <View style={[styles.rowCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text weight="medium">Reminders</Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                Coming soon.
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.brandTertiary }]}>
              <Text variant="caption" color={colors.brandPrimary}>
                Soon
              </Text>
            </View>
          </View>
        </Section>

        <Section title="Data">
          <Pressable
            testID="profile-reset"
            onPress={onReset}
            style={[styles.rowCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text weight="medium" color={colors.error}>
                Clear all data
              </Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                Deletes every task, project, and note.
              </Text>
            </View>
            <Icon name="trash-2" size={18} color={colors.error} />
          </Pressable>
        </Section>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl, alignItems: "center" }}>
          <Text variant="caption" color={colors.muted}>
            NOVA · v1.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text
        variant="label"
        color={colors.muted}
        style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md, letterSpacing: 0.5 }}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text variant="heading">{value}</Text>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
