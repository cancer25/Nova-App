import { Stack } from "expo-router";
import { LogBox, useColorScheme, View } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { StoreProvider, useStore } from "@/src/store/store";
import { ThemeContext, resolveColors } from "@/src/theme";
import Feather from "@react-native-vector-icons/feather";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync().catch(() => {});

// Prewarm icon assets (fix for android expo-go)
const _prewarm = Feather;

function ThemedShell() {
  const { data, loading } = useStore();
  const systemScheme = useColorScheme();
  const pref = data.settings.themePref;
  const { colors, isDark } = resolveColors(pref, systemScheme);

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        pref,
        setPref: () => {},
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        {loading ? null : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.surface },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen
              name="capture"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="search"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="smart-capture"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen name="task/[id]" />
            <Stack.Screen name="project/[id]" />
            <Stack.Screen name="note/[id]" />
            <Stack.Screen name="assistant" options={{ animation: "slide_from_right" }} />
          </Stack>
        )}
      </View>
    </ThemeContext.Provider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "PlusJakartaSans-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <ThemedShell />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
