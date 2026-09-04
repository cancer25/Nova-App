import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";
import { spacing, useTheme } from "@/src/theme";
import { Icon } from "./Icon";

export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
  actionLabel,
  onAction,
  testID,
}: {
  icon?: React.ComponentProps<typeof Icon>["name"];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.brandTertiary }]}>
        <Icon name={icon} size={28} color={colors.brandPrimary} />
      </View>
      <Text variant="heading" style={{ marginTop: spacing.lg, textAlign: "center" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          variant="body"
          color={colors.muted}
          style={{ marginTop: spacing.sm, textAlign: "center", maxWidth: 280 }}
        >
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: spacing.xl }}
          testID={testID ? `${testID}-action` : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
