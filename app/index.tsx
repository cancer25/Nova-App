import { Redirect } from "expo-router";
import { useStore } from "@/src/store/store";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { data, loading } = useStore();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  return <Redirect href={data.settings.onboarded ? "/(tabs)" : "/onboarding"} />;
}
