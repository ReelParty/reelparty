"use client";

import { type ReactNode, useEffect, useRef } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SPOT_DISMISS_FADE_MS = 400;

export function SpotFadeWrap({
  wrap,
  fading,
  onFadeComplete,
  children,
}: {
  wrap: boolean;
  fading: boolean;
  onFadeComplete: () => void;
  children: ReactNode;
}) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const onFadeCompleteRef = useRef(onFadeComplete);
  onFadeCompleteRef.current = onFadeComplete;

  useEffect(() => {
    if (!fading) return;
    opacity.value = 1;
    translateY.value = 0;
    opacity.value = withTiming(
      0,
      { duration: SPOT_DISMISS_FADE_MS },
      (finished) => {
        if (finished) runOnJS(onFadeCompleteRef.current)();
      },
    );
    translateY.value = withTiming(10, { duration: SPOT_DISMISS_FADE_MS });
  }, [fading, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!wrap) return children;

  return <Animated.View style={style}>{children}</Animated.View>;
}
