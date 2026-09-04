import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Icon } from "@/src/components/Icon";
import { useTheme, spacing } from "@/src/theme";
import { useStore } from "@/src/store/store";
import { formatShortDate } from "@/src/utils/date";

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, updateNote, deleteNote } = useStore();

  const note = useMemo(() => data.notes.find((n) => n.id === id), [data.notes, id]);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");

  if (!note) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <Text variant="body" color={colors.muted}>Note not found</Text>
      </View>
    );
  }

  const commit = () => {
    updateNote(note.id, { title: title.trim(), body });
  };

  const onDelete = () => {
    Alert.alert("Delete note?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteNote(note.id);
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
        <Pressable
          testID="note-back"
          onPress={() => {
            commit();
            router.back();
          }}
          hitSlop={12}
        >
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Pressable testID="note-delete" onPress={onDelete} hitSlop={12}>
          <Icon name="trash-2" size={22} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        <View style={{ paddingHorizontal: spacing.xl }}>
          <TextInput
            testID="note-title"
            value={title}
            onChangeText={setTitle}
            onEndEditing={commit}
            placeholder="Title"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.onSurface,
              fontFamily: "PlusJakartaSans-SemiBold",
              fontSize: 28,
              lineHeight: 36,
            }}
          />
          <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
            {formatShortDate(note.updatedAt)}
          </Text>
          <TextInput
            testID="note-body"
            value={body}
            onChangeText={setBody}
            onEndEditing={commit}
            placeholder="Start writing..."
            placeholderTextColor={colors.muted}
            multiline
            autoFocus={!note.body && !note.title}
            style={{
              color: colors.onSurface,
              fontFamily: "PlusJakartaSans-Regular",
              fontSize: 17,
              lineHeight: 26,
              marginTop: spacing.lg,
              minHeight: 400,
              textAlignVertical: "top",
            }}
          />
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
});
