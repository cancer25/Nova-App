import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "./Icon";
import { radius, useTheme } from "@/src/theme";

export function MicButton({
  active,
  disabled,
  onPress,
  testID,
}: {
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(0);
  }, [active, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  const bg = active ? colors.brandPrimary : colors.surfaceSecondary;
  const border = active ? colors.brandPrimary : colors.border;
  const fg = active ? colors.onBrandPrimary : colors.onSurface;

  return (
    <View style={styles.wrap}>
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              backgroundColor: colors.brandPrimary,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      ) : null}
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: bg,
            borderColor: border,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Icon name={active ? "square" : "mic"} size={18} color={fg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: radius.pill,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
