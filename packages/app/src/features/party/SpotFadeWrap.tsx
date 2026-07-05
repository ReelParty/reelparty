"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Animated } from "react-native";

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
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const onFadeCompleteRef = useRef(onFadeComplete);
  onFadeCompleteRef.current = onFadeComplete;

  useEffect(() => {
    if (!fading) return;
    let cancelled = false;
    fadeAnim.setValue(1);
    slideAnim.setValue(0);

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: SPOT_DISMISS_FADE_MS,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: SPOT_DISMISS_FADE_MS,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (cancelled || !finished) return;
        onFadeCompleteRef.current();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [fading, fadeAnim, slideAnim]);

  if (!wrap) return children;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}
