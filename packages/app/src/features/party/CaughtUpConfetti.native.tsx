"use client";

import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  buildCaughtUpConfettiParticles,
  burstOpacity,
  burstProgress,
  burstScale,
  type CaughtUpConfettiParticle,
} from "./caughtUpConfettiParticles";

const POP_EASING = Easing.bezier(0.16, 1, 0.3, 1);

function BurstParticle({
  particle: p,
  active,
}: {
  particle: CaughtUpConfettiParticle;
  active: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      p.delay,
      withTiming(1, {
        duration: p.duration,
        easing: POP_EASING,
      }),
    );
    return () => cancelAnimation(progress);
  }, [active, p.delay, p.duration, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const burst = burstProgress(t);
    const dist = p.distance * burst;
    const gravity = t * t * p.gravity;

    return {
      opacity: burstOpacity(t),
      transform: [
        { translateX: Math.cos(p.angle) * dist },
        { translateY: Math.sin(p.angle) * dist + gravity },
        { rotate: `${p.spin * burst}deg` },
        { scale: burstScale(t) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          width: p.width,
          height: p.height,
          backgroundColor: p.color,
          borderRadius: p.round ? Math.max(p.width, p.height) / 2 : 2,
        },
        style,
      ]}
    />
  );
}

export function CaughtUpConfetti({ active }: { active: boolean }) {
  const particles = useMemo(() => buildCaughtUpConfettiParticles(), []);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.host} accessibilityElementsHidden>
      {particles.map((p) => (
        <BurstParticle key={p.id} particle={p} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 0,
  },
  particle: {
    position: "absolute",
  },
});
