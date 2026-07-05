export const REACTION_BURST_MS = 4200;
export const EXPLOSION_PARTICLES = 14;

export type ReactionBurstPayload = {
  id: number;
  emoji: string;
  name: string;
  color: string;
  userId: string;
  avatarFace: number;
};

export type ReactionBurstParticle = {
  id: number;
  angle: number;
  dist: number;
  delayMs: number;
  scale: number;
};

export function buildReactionBurstParticles(
  count = EXPLOSION_PARTICLES,
): ReactionBurstParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (Math.random() - 0.5) * 22;
    return {
      id: i,
      angle,
      dist: 42 + Math.random() * 62,
      delayMs: Math.random() * 100,
      scale: 0.75 + Math.random() * 0.5,
    };
  });
}
