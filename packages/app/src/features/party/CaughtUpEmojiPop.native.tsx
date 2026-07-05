"use client";

import { type ReactNode, useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function CaughtUpEmojiPop({
  animate,
  children,
}: {
  animate: boolean;
  children: ReactNode;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!animate) {
      scale.value = 1;
      return;
    }
    scale.value = 0.12;
    scale.value = withSpring(1, {
      damping: 11,
      stiffness: 210,
      mass: 0.72,
    });
  }, [animate, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content =
    typeof children === "string" ? (
      <Text style={{ fontSize: 46, lineHeight: 52 }}>{children}</Text>
    ) : (
      children
    );

  return (
    <Animated.View
      style={[{ zIndex: 2, position: "relative" }, style]}
    >
      {content}
    </Animated.View>
  );
}
