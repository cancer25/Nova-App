import React from "react";
import Feather from "@react-native-vector-icons/feather";

// Thin wrapper so we can swap icon sets in one place.
export function Icon({
  name,
  size = 20,
  color,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
