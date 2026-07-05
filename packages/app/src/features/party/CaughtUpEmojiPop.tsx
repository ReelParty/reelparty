"use client";

import { type ReactNode } from "react";
import { Text, View } from "react-native";

export function CaughtUpEmojiPop({
  animate,
  children,
}: {
  animate: boolean;
  children: ReactNode;
}) {
  return (
    <View
      className={animate ? "rp-caught-up-emoji rp-caught-up-emoji--pop" : "rp-caught-up-emoji"}
      style={{ zIndex: 2, position: "relative" }}
    >
      {typeof children === "string" ? (
        <Text style={{ fontSize: 46, lineHeight: 52 }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
