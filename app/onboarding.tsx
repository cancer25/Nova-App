import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/src/components/Text";
import { Button } from "@/src/components/Button";
import { useTheme, radius, spacing } from "@/src/theme";
import { useStore } from "@/src/store/store";
import type { Focus } from "@/src/store/types";

const IMG_1 = "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZGVzayUyMHNldHVwJTIwYWVzdGhldGljfGVufDB8fHx8MTc4ODQ4MjQyN3ww&ixlib=rb-4.1.0&q=85&w=1200";
const IMG_2 = "https://images.unsplash.com/photo-1551042710-de601b4dcdc3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwbm90ZWJvb2slMjBwbGFubmVyJTIwYWVzdGhldGljfGVufDB8fHx8MTc4ODQ4MjQyN3ww&ixlib=rb-4.1.0&q=85&w=1200";
const IMG_3 = "https://images.unsplash.com/photo-1768209198274-01dd8d79cd1e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMHNvZnQlMjBtaW5pbWFsaXN0JTIwc2hhcGVzJTIwc2FnZSUyMGdyZWVufGVufDB8fHx8MTc4ODQ4MjQyN3ww&ixlib=rb-4.1.0&q=85&w=1200";

const STEPS = [
  { key: "welcome", image: IMG_1, title: "Welcome to NOVA", subtitle: "Your quiet space to think, plan, and get things done." },
  { key: "promise", image: IMG_2, title: "Turn thoughts into plans.", subtitle: "Capture anything on your mind — organize it in seconds." },
  { key: "clarity", image: IMG_3, title: "Know what to do next.", subtitle: "A simple daily view keeps you focused and clear." },
] as const;

const FOCUS_OPTIONS: { key: Focus; label: string }[] = [
  { key: "tasks", label: "My tasks" },
  { key: "studies", label: "My studies" },
  { key: "work", label: "My work" },
  { key: "personal", label: "My personal life" },
  { key: "everything", label: "Everything" },
];

export default function Onboarding() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { updateSettings } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [focus, setFocus] = useState<Focus | null>(null);

  const totalSlideSteps = STEPS.length; // 3
  const isSlide = step < totalSlideSteps;
  const isNameStep = step === totalSlideSteps;
  const isFocusStep = step === totalSlideSteps + 1;

  const canContinue =
    isSlide || (isNameStep && name.trim().length > 0) || (isFocusStep && focus !== null);

  const onContinue = () => {
    Haptics.selectionAsync();
    if (isFocusStep) {
      updateSettings({
        name: name.trim(),
        focus,
        onboarded: true,
      });
      router.replace("/(tabs)");
      return;
    }
    setStep((s) => s + 1);
  };

  if (isSlide) {
    const s = STEPS[step];
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <Image source={{ uri: s.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.85)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: insets.bottom + spacing.xl, paddingHorizontal: spacing.xl }}>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === step ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                    width: i === step ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>
          <Text variant="display" color="#FFFFFF" style={{ marginTop: spacing.xl }}>
            {s.title}
          </Text>
          <Text variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
            {s.subtitle}
          </Text>
          <Button
            testID={`onboarding-continue-${step}`}
            label={step === STEPS.length - 1 ? "Get started" : "Continue"}
            onPress={onContinue}
            size="lg"
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + spacing.xxxl,
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {isNameStep ? (
            <>
              <Text variant="display">What should we call you?</Text>
              <Text variant="body" color={colors.muted} style={{ marginTop: spacing.sm }}>
                Just a first name is fine.
              </Text>
              <TextInput
                testID="onboarding-name-input"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => name.trim() && onContinue()}
                style={[
                  styles.input,
                  { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
                ]}
              />
            </>
          ) : (
            <>
              <Text variant="display">What do you want to organize?</Text>
              <Text variant="body" color={colors.muted} style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
                We'll set things up for you.
              </Text>
              <View style={{ gap: spacing.md }}>
                {FOCUS_OPTIONS.map((opt) => {
                  const selected = focus === opt.key;
                  return (
                    <Pressable
                      testID={`onboarding-focus-${opt.key}`}
                      key={opt.key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setFocus(opt.key);
                      }}
                      style={[
                        styles.focusRow,
                        {
                          backgroundColor: selected ? colors.brandSecondary : colors.surfaceSecondary,
                          borderColor: selected ? colors.brandPrimary : colors.border,
                        },
                      ]}
                    >
                      <Text weight="medium" color={selected ? colors.onBrandSecondary : colors.onSurface}>
                        {opt.label}
                      </Text>
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected ? colors.brandPrimary : colors.borderStrong,
                            backgroundColor: selected ? colors.brandPrimary : "transparent",
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.lg,
            paddingTop: spacing.sm,
            backgroundColor: colors.surface,
          }}
        >
          <Button
            testID="onboarding-primary-cta"
            label={isFocusStep ? "Enter NOVA" : "Continue"}
            onPress={onContinue}
            disabled={!canContinue}
            size="lg"
          />
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 6, borderRadius: 3 },
  input: {
    marginTop: spacing.xl,
    height: 56,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
    fontFamily: "PlusJakartaSans-Medium",
  },
  focusRow: {
    height: 60,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
});
