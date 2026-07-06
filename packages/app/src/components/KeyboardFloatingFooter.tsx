import { type ReactNode } from "react";
import { View } from "react-native";

/** Native: flex spacer pushes the action button to the bottom of the screen. */
export function KeyboardFloatingFooter({ children }: { children: ReactNode }) {
  return (
    <>
      <View className="flex-1" />
      {children}
    </>
  );
}
