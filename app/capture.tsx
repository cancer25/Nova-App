import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { useTheme, spacing, radius } from "@/src/theme";
import { useStore } from "@/src/store/store";
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS, categoryLabel, priorityLabel, itemTypeLabel, addDays } from "@/src/utils/date";
import type { Category, Priority, ItemType } from "@/src/store/types";
import { ChipRow } from "@/src/components/ChipRow";

const QUICK_DATES: { key: "none" | "today" | "tomorrow" | "week"; label: string }[] = [
  { key: "none", label: "No date" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "In a week" },
];

export default function Capture() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, addTask, addNote, addProject } = useStore();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("task");
  const [priority, setPriority] = useState<Priority>(data.settings.defaultPriority);
  const [category, setCategory] = useState<Category>("personal");
  const [dueKey, setDueKey] = useState<"none" | "today" | "tomorrow" | "week">("none");

  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = title.trim();
    if (type === "project") {
      addProject({ title: t, category });
    } else if (type === "idea") {
      addNote({ title: t, body: "" });
    } else {
      let dueDate: string | null = null;
      const now = new Date();
      if (dueKey === "today") dueDate = now.toISOString();
      else if (dueKey === "tomorrow") dueDate = addDays(now, 1).toISOString();
      else if (dueKey === "week") dueDate = addDays(now, 7).toISOString();
      addTask({ title: t, type, priority, category, dueDate });
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <View style={[styles.headerBar, { paddingTop: Platform.OS === "ios" ? spacing.md : insets.top + spacing.sm }]}>
        <Pressable testID="capture-close" onPress={() => router.back()} hitSlop={12}>
          <Text variant="body" color={colors.muted}>
            Cancel
          </Text>
        </Pressable>
        <Text weight="medium">Quick capture</Text>
        <Pressable
          testID="capture-save"
          onPress={save}
          disabled={!canSave}
          hitSlop={12}
        >
          <Text weight="semibold" color={canSave ? colors.brandPrimary : colors.muted}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <TextInput
            testID="capture-title-input"
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={colors.muted}
            multiline
            autoFocus
            style={{
              color: colors.onSurface,
              fontFamily: "PlusJakartaSans-Medium",
              fontSize: 22,
              lineHeight: 30,
              minHeight: 90,
              textAlignVertical: "top",
            }}
          />
        </View>

        <Section label="Type">
          <ChipRow
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
            labelFor={itemTypeLabel}
            testIDPrefix="capture-type"
          />
        </Section>

        {type !== "project" && type !== "idea" ? (
          <>
            <Section label="Priority">
              <ChipRow
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={setPriority}
                labelFor={priorityLabel}
                testIDPrefix="capture-priority"
              />
            </Section>

            <Section label="Due">
              <ChipRow
                options={QUICK_DATES.map((d) => d.key)}
                value={dueKey}
                onChange={setDueKey}
                labelFor={(k) => QUICK_DATES.find((q) => q.key === k)?.label ?? String(k)}
                testIDPrefix="capture-due"
              />
            </Section>
          </>
        ) : null}

        <Section label="Category">
          <ChipRow
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
            labelFor={categoryLabel}
            testIDPrefix="capture-category"
          />
        </Section>
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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
});
