import { WELCOME_TEXTURE_EMOJIS, type Platform } from "@reelparty/shared";

const PLATFORMS: Platform[] = ["tiktok", "youtube", "instagram", "facebook"];

export type WelcomeTextureParticle = {
  id: number;
  kind: "logo" | "emoji";
  value: Platform | string;
  left: number;
  offset: number;
  duration: number;
  size: number;
  scale: number;
  drift: number;
  rotate: number;
  opacity: number;
};

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function pickSize(isLogo: boolean) {
  const roll = Math.random();
  if (roll < 0.25) {
    return isLogo ? 12 + Math.random() * 6 : 14 + Math.random() * 6;
  }
  if (roll < 0.75) {
    return isLogo ? 18 + Math.random() * 10 : 20 + Math.random() * 12;
  }
  return isLogo ? 28 + Math.random() * 10 : 32 + Math.random() * 12;
}

export function buildWelcomeTextureParticles(): WelcomeTextureParticle[] {
  return Array.from({ length: 72 }, (_, i) => {
    const isLogo = Math.random() < 0.32;
    const size = pickSize(isLogo);
    const scale = 0.84 + Math.random() * 0.22;
    return {
      id: i,
      kind: isLogo ? "logo" : "emoji",
      value: isLogo ? pick(PLATFORMS) : pick(WELCOME_TEXTURE_EMOJIS),
      left: Math.random() * 98 + 1,
      offset: Math.random(),
      duration: 24 + Math.random() * 26,
      size,
      scale,
      drift: -40 + Math.random() * 80,
      rotate: -22 + Math.random() * 44,
      opacity: 0.07 + (size / 64) * 0.095 + Math.random() * 0.045,
    };
  });
}
