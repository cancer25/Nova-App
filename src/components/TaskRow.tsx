import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View, Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { radius, spacing, useTheme } from "@/src/theme";
import { Task } from "@/src/store/types";
import { formatShortDate, isOverdue } from "@/src/utils/date";
import { useStore } from "@/src/store/store";

export function TaskRow({ task, hidePush = false }: { task: Task; hidePush?: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { toggleTask } = useStore();

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(task.completed ? 0.4 : 1)).current;
  const fill = useRef(new Animated.Value(task.completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: task.completed ? 0.4 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(fill, {
      toValue: task.completed ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [task.completed, opacity, fill]);

  const onToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!task.completed) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.85, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }
    toggleTask(task.id);
  };

  const overdue = isOverdue(task);
  const dueLabel = task.dueDate ? formatShortDate(task.dueDate) : null;

  const checkBg = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceSecondary, colors.brandPrimary],
  });
  const checkBorder = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderStrong, colors.brandPrimary],
  });

  const priorityColor =
    task.priority === "high"
      ? colors.error
      : task.priority === "low"
        ? colors.muted
        : colors.info;

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        testID={`task-row-${task.id}`}
        onPress={() => !hidePush && router.push({ pathname: "/task/[id]", params: { id: task.id } })}
        style={styles.row}
      >
        <Pressable
          testID={`task-toggle-${task.id}`}
          hitSlop={12}
          onPress={onToggle}
          style={styles.checkWrap}
        >
          <Animated.View
            style={[
              styles.check,
              {
                backgroundColor: checkBg,
                borderColor: checkBorder,
                transform: [{ scale }],
              },
            ]}
          >
            {task.completed ? <Icon name="check" size={14} color={colors.onBrandPrimary} /> : null}
          </Animated.View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              textDecorationLine: task.completed ? "line-through" : "none",
            }}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={styles.metaRow}>
            {task.priority !== "normal" ? (
              <View style={styles.metaItem}>
                <View style={[styles.dot, { backgroundColor: priorityColor }]} />
                <Text variant="caption" color={colors.muted}>
                  {task.priority === "high" ? "High" : "Low"}
                </Text>
              </View>
            ) : null}
            {dueLabel ? (
              <View style={styles.metaItem}>
                <Icon name="calendar" size={12} color={overdue ? colors.error : colors.muted} />
                <Text variant="caption" color={overdue ? colors.error : colors.muted}>
                  {dueLabel}
                </Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Text variant="caption" color={colors.muted}>
                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  checkWrap: { paddingTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 4,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
