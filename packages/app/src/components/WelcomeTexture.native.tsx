"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Dimensions,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { PlatformLogo } from "@reelparty/ui";
import { type Platform } from "@reelparty/shared";
import {
  buildWelcomeTextureParticles,
  type WelcomeTextureParticle,
} from "./welcomeTextureParticles";

const FALL_EASING = Easing.linear;

function TextureParticle({
  particle: p,
  height,
}: {
  particle: WelcomeTextureParticle;
  height: number;
}) {
  const progress = useSharedValue(p.offset);

  useEffect(() => {
    progress.value = p.offset;
    progress.value = withRepeat(
      withTiming(p.offset + 1, {
        duration: p.duration * 1000,
        easing: FALL_EASING,
      }),
      -1,
      false,
    );
  }, [p.duration, p.offset, progress]);

  const style = useAnimatedStyle(() => {
    const frac = progress.value - Math.floor(progress.value);
    const startY = -height * 0.12;
    const endY = height * 1.12;
    const y = startY + frac * (endY - startY);
    const rotate = `${p.rotate + 22 * frac}deg`;

    return {
      opacity: p.opacity,
      transform: [
        { translateX: p.drift * frac },
        { translateY: y },
        { rotate },
        { scale: p.scale },
      ],
    };
  }, [height, p.drift, p.offset, p.opacity, p.rotate, p.scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.particle, { left: `${p.left}%` }, style]}
    >
      {p.kind === "logo" ? (
        <PlatformLogo platform={p.value as Platform} size={p.size} color="rgba(255,255,255,0.42)" />
      ) : (
        <Text style={{ fontSize: p.size, lineHeight: p.size * 1.05 }}>{p.value}</Text>
      )}
    </Animated.View>
  );
}

export function WelcomeTexture() {
  const particles = useMemo(() => buildWelcomeTextureParticles(), []);
  const [height, setHeight] = useState(Dimensions.get("window").height);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    if (next > 0) setHeight(next);
  };

  if (reduceMotion) return null;

  return (
    <View
      pointerEvents="none"
      style={styles.container}
      onLayout={onLayout}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {particles.map((p) => (
        <TextureParticle key={p.id} particle={p} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -20,
    left: -18,
    right: -18,
    bottom: -20,
    overflow: "hidden",
    zIndex: 0,
  },
  particle: {
    position: "absolute",
    top: 0,
  },
});
