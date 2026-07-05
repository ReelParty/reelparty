"use client";

import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Avatar } from "@reelparty/ui";
import {
  buildReactionBurstParticles,
  REACTION_BURST_MS,
  type ReactionBurstParticle,
} from "./reactionBurstParticles";

const EXPLODE_EASING = Easing.bezier(0.12, 0.9, 0.28, 1);

function ExplosionParticle({
  particle: p,
  emoji,
}: {
  particle: ReactionBurstParticle;
  emoji: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      p.delayMs,
      withTiming(1, { duration: 2600, easing: EXPLODE_EASING }),
    );
  }, [p.delayMs, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    let d: number;
    let s: number;
    let opacity: number;
    if (t < 0.14) {
      const u = t / 0.14;
      d = p.dist * 0.88 * u;
      s = 0.12 + u * (1.18 * p.scale - 0.12);
      opacity = 1;
    } else if (t < 0.45) {
      const u = (t - 0.14) / 0.31;
      d = p.dist * (0.88 + u * 0.17);
      s = 1.18 * p.scale - u * (0.18 * p.scale);
      opacity = 1 - u * 0.05;
    } else {
      const u = (t - 0.45) / 0.55;
      d = p.dist * (1.05 + u * 0.35);
      s = p.scale * (1 - u * 0.6);
      opacity = 0.95 * (1 - u);
    }
    const angleRad = (p.angle * Math.PI) / 180;
    return {
      opacity,
      transform: [
        { translateX: Math.sin(angleRad) * d },
        { translateY: -Math.cos(angleRad) * d },
        { scale: s },
      ],
    };
  });

  return (
    <Animated.View style={[styles.particle, style]} pointerEvents="none">
      <Text style={{ fontSize: 30 * p.scale, lineHeight: 30 * p.scale }}>{emoji}</Text>
    </Animated.View>
  );
}

function IdentityBadge({
  name,
  userId,
  avatarFace,
}: {
  name: string;
  userId: string;
  avatarFace: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 3900, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    let scale = 1;
    let opacity = 1;
    if (t < 0.07) {
      const u = t / 0.07;
      scale = 0.35 + u * 0.75;
      opacity = u;
    } else if (t < 0.12) {
      const u = (t - 0.07) / 0.05;
      scale = 1.1 - u * 0.1;
      opacity = 1;
    } else if (t > 0.78) {
      const u = (t - 0.78) / 0.22;
      opacity = 1 - u;
      scale = 1 - u * 0.06;
    }
    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.identity, style]} pointerEvents="none">
      <Avatar id={userId} name={name} faceIndex={avatarFace} sm />
      <Text style={styles.identityName} numberOfLines={1}>
        {name}
      </Text>
    </Animated.View>
  );
}

function FlashRing() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scale: progress.value * 5 }],
  }));

  return <Animated.View style={[styles.flash, style]} pointerEvents="none" />;
}

export function ReactionBurst({
  burstId,
  emoji,
  name,
  userId,
  avatarFace,
  onDone,
}: {
  burstId: number;
  emoji: string;
  name: string;
  userId: string;
  avatarFace: number;
  onDone: () => void;
}) {
  const particles = useMemo(() => buildReactionBurstParticles(), []);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), REACTION_BURST_MS);
    return () => clearTimeout(t);
  }, [burstId]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden>
      <View style={styles.centerLayer}>
        <FlashRing />
        <IdentityBadge name={name} userId={userId} avatarFace={avatarFace} />
      </View>
      <View style={styles.particleLayer}>
        {particles.map((p) => (
          <ExplosionParticle key={p.id} particle={p} emoji={emoji} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  flash: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  identity: {
    alignItems: "center",
    gap: 6,
    maxWidth: 88,
  },
  identityName: {
    maxWidth: 88,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.62)",
    textAlign: "center",
  },
  particleLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },
});
