import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { radius, spacing, useTheme } from "@/src/theme";

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  labelFor,
  testIDPrefix,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelFor?: (v: T) => string;
  testIDPrefix?: string;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
            testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
            onPress={() => onChange(opt)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.brandPrimary : colors.surfaceSecondary,
                borderColor: selected ? colors.brandPrimary : colors.border,
              },
            ]}
          >
            <Text
              variant="label"
              color={selected ? colors.onBrandPrimary : colors.onSurface}
            >
              {labelFor ? labelFor(opt) : String(opt)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, height: 56 },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    height: 56,
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
