"use client";

import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { Avatar, Text } from "@reelparty/ui";
import {
  buildReactionBurstParticles,
  REACTION_BURST_MS,
  type ReactionBurstParticle,
} from "./reactionBurstParticles";

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
    <View className="rp-reaction-explosion" pointerEvents="none" accessibilityElementsHidden>
      <View className="rp-reaction-explosion-flash" />
      <View className="rp-reaction-identity">
        <Avatar id={userId} name={name} faceIndex={avatarFace} sm />
        <Text className="rp-reaction-identity-name" numberOfLines={1}>
          {name}
        </Text>
      </View>
      {particles.map((p) => (
        <BurstParticle key={p.id} particle={p} emoji={emoji} />
      ))}
    </View>
  );
}

function BurstParticle({
  particle: p,
  emoji,
}: {
  particle: ReactionBurstParticle;
  emoji: string;
}) {
  return (
    <View
      className="rp-reaction-particle rp-reaction-particle--emoji"
      style={{
        ["--angle" as string]: `${p.angle}deg`,
        ["--dist" as string]: `${p.dist}px`,
        ["--delay" as string]: `${p.delayMs}ms`,
        ["--scale" as string]: String(p.scale),
      }}
    >
      <Text style={{ fontSize: 30 * p.scale, lineHeight: 30 * p.scale }}>{emoji}</Text>
    </View>
  );
}
