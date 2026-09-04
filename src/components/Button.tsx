import React from "react";
import { Pressable, StyleSheet, ViewStyle, ActivityIndicator, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { radius, spacing, useTheme } from "@/src/theme";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  style,
  testID,
  size = "md",
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Icon>["name"];
  style?: ViewStyle;
  testID?: string;
  size?: "md" | "lg";
}) {
  const { colors } = useTheme();

  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "secondary"
        ? colors.surfaceSecondary
        : "transparent";
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "secondary"
        ? colors.onSurface
        : colors.onSurface;
  const borderColor = variant === "secondary" ? colors.border : "transparent";

  const heights = { md: 48, lg: 56 };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={() => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={18} color={fg} /> : null}
          <Text weight="medium" color={fg} style={{ fontSize: 16 }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
