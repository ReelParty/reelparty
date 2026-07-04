"use client";

import { useMemo } from "react";
import { PlatformLogo } from "@reelparty/ui";
import { type Platform } from "@reelparty/shared";
import { buildWelcomeTextureParticles } from "./welcomeTextureParticles";

export function WelcomeTexture() {
  const particles = useMemo(() => buildWelcomeTextureParticles(), []);

  return (
    <div className="rp-welcome-texture" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={`rp-welcome-texture-item rp-welcome-texture-item--${p.kind}`}
          style={{
            left: `${p.left}%`,
            ["--dur" as string]: `${p.duration}s`,
            ["--offset" as string]: p.offset,
            ["--drift" as string]: `${p.drift}px`,
            ["--rot" as string]: `${p.rotate}deg`,
            ["--op" as string]: p.opacity,
            ["--scale" as string]: p.scale,
            fontSize: p.kind === "emoji" ? p.size : undefined,
          }}
        >
          {p.kind === "logo" ? (
            <PlatformLogo platform={p.value as Platform} size={p.size} />
          ) : (
            p.value
          )}
        </span>
      ))}
    </div>
  );
}
