import { Tabs } from "expo-router";
import { StyleSheet, Platform } from "react-native";
import { useTheme, font } from "@/src/theme";
import { Icon } from "@/src/components/Icon";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: font.medium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size - 2} color={color} />,
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Icon name="check-circle" size={size - 2} color={color} />,
          tabBarButtonTestID: "tab-today",
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => <Icon name="folder" size={size - 2} color={color} />,
          tabBarButtonTestID: "tab-projects",
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => <Icon name="edit-3" size={size - 2} color={color} />,
          tabBarButtonTestID: "tab-notes",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Icon name="user" size={size - 2} color={color} />,
          tabBarButtonTestID: "tab-profile",
        }}
      />
    </Tabs>
  );
}
