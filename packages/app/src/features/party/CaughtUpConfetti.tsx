"use client";

import { useMemo } from "react";
import { View } from "react-native";
import {
  buildCaughtUpConfettiParticles,
  burstProgress,
} from "./caughtUpConfettiParticles";

export function CaughtUpConfetti({ active }: { active: boolean }) {
  const particles = useMemo(() => buildCaughtUpConfettiParticles(), []);

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      className="rp-caught-up-confetti"
      accessibilityElementsHidden
    >
      {particles.map((p) => {
        const burst = burstProgress(1);
        const tx = Math.cos(p.angle) * p.distance * burst;
        const ty = Math.sin(p.angle) * p.distance * burst + p.gravity;
        const mid = burstProgress(0.35);
        const txMid = Math.cos(p.angle) * p.distance * mid;
        const tyMid = Math.sin(p.angle) * p.distance * mid + p.gravity * 0.35 * 0.35;

        return (
          <View
            key={p.id}
            className="rp-caught-up-confetti-particle"
            style={{
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              borderRadius: p.round ? Math.max(p.width, p.height) / 2 : 2,
              ["--tx" as string]: `${tx}px`,
              ["--ty" as string]: `${ty}px`,
              ["--tx-mid" as string]: `${txMid}px`,
              ["--ty-mid" as string]: `${tyMid}px`,
              ["--rot" as string]: `${p.spin}deg`,
              ["--dur" as string]: `${p.duration}ms`,
              ["--delay" as string]: `${p.delay}ms`,
            }}
          />
        );
      })}
    </View>
  );
}
