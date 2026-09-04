import { useColorScheme } from "react-native";
import { createContext, useContext } from "react";

export type ThemePref = "system" | "light" | "dark";

export const lightColors = {
  surface: "#F9F9F9",
  onSurface: "#111111",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#111111",
  surfaceTertiary: "#F0F0F0",
  onSurfaceTertiary: "#111111",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#F9F9F9",
  brand: "#4A6B53",
  brandPrimary: "#4A6B53",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#E3EDE6",
  onBrandSecondary: "#2D4534",
  brandTertiary: "#F2F7F4",
  onBrandTertiary: "#395441",
  success: "#4A6B53",
  onSuccess: "#FFFFFF",
  warning: "#C27A29",
  onWarning: "#FFFFFF",
  error: "#A63D31",
  onError: "#FFFFFF",
  info: "#566470",
  onInfo: "#FFFFFF",
  border: "#E5E5E5",
  borderStrong: "#CCCCCC",
  divider: "#EFEFEF",
  muted: "#737373",
};

export const darkColors: typeof lightColors = {
  surface: "#0E0E0E",
  onSurface: "#F5F5F5",
  surfaceSecondary: "#1A1A1A",
  onSurfaceSecondary: "#F5F5F5",
  surfaceTertiary: "#262626",
  onSurfaceTertiary: "#F5F5F5",
  surfaceInverse: "#F5F5F5",
  onSurfaceInverse: "#0E0E0E",
  brand: "#6B9677",
  brandPrimary: "#6B9677",
  onBrandPrimary: "#111111",
  brandSecondary: "#24362A",
  onBrandSecondary: "#A2C9AD",
  brandTertiary: "#162119",
  onBrandTertiary: "#B8DECD",
  success: "#6B9677",
  onSuccess: "#111111",
  warning: "#DB9B4F",
  onWarning: "#111111",
  error: "#D1655A",
  onError: "#111111",
  info: "#7E8F9E",
  onInfo: "#111111",
  border: "#2A2A2A",
  borderStrong: "#404040",
  divider: "#1F1F1F",
  muted: "#888888",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const font = {
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
  semibold: "PlusJakartaSans-SemiBold",
};

export const type = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export type Colors = typeof lightColors;

export const ThemeContext = createContext<{
  colors: Colors;
  isDark: boolean;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}>({
  colors: lightColors,
  isDark: false,
  pref: "system",
  setPref: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function resolveColors(pref: ThemePref, systemScheme: "light" | "dark" | null | undefined): {
  colors: Colors;
  isDark: boolean;
} {
  const isDark =
    pref === "dark" || (pref === "system" && systemScheme === "dark");
  return { colors: isDark ? darkColors : lightColors, isDark };
}

// Default colors export used by components that don't need dark mode reactivity
export const colors = lightColors;
