import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { font, type, useTheme } from "@/src/theme";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption";
type Weight = "regular" | "medium" | "semibold";

export function Text({
  variant = "body",
  weight,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; weight?: Weight; color?: string }) {
  const { colors } = useTheme();
  const variantStyle = variantStyles[variant];
  const fontFamily = weight ? weightMap[weight] : variantWeight[variant];
  return (
    <RNText
      {...rest}
      style={[
        { color: color ?? colors.onSurface, fontFamily },
        variantStyle,
        style,
      ]}
    />
  );
}

const weightMap = {
  regular: font.regular,
  medium: font.medium,
  semibold: font.semibold,
};

const variantWeight: Record<Variant, string> = {
  display: font.semibold,
  title: font.semibold,
  heading: font.medium,
  body: font.regular,
  label: font.medium,
  caption: font.regular,
};

const variantStyles = StyleSheet.create({
  display: { fontSize: type.xxxl, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontSize: type.xxl, lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontSize: type.xl, lineHeight: 26, letterSpacing: -0.2 },
  body: { fontSize: type.lg, lineHeight: 22 },
  label: { fontSize: type.base, lineHeight: 18 },
  caption: { fontSize: type.sm, lineHeight: 16 },
});
