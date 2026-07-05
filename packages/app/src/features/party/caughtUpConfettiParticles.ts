export const CAUGHT_UP_CONFETTI_COLORS = [
  "#58cc02",
  "#1cb0f6",
  "#ce82ff",
  "#ffc800",
  "#ff4b4b",
  "#ff9600",
  "#ffffff",
] as const;

export type CaughtUpConfettiParticle = {
  id: number;
  angle: number;
  distance: number;
  width: number;
  height: number;
  color: string;
  round: boolean;
  spin: number;
  delay: number;
  duration: number;
  gravity: number;
};

/** Bias burst upward/outward like celebration cannons. */
function pickBurstAngle(): number {
  if (Math.random() < 0.68) {
    return -Math.PI + Math.random() * Math.PI;
  }
  return Math.random() * Math.PI * 2;
}

function pickDistance(): number {
  if (Math.random() < 0.28) return 118 + Math.random() * 92;
  return 48 + Math.random() * 78;
}

export function buildCaughtUpConfettiParticles(
  count = 48,
): CaughtUpConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const strip = Math.random() > 0.42;
    const round = !strip && Math.random() > 0.55;
    const size = 5 + Math.random() * 7;

    return {
      id: i,
      angle: pickBurstAngle(),
      distance: pickDistance(),
      width: strip ? 3 + Math.random() * 3.5 : size,
      height: strip ? 9 + Math.random() * 9 : size,
      color: CAUGHT_UP_CONFETTI_COLORS[i % CAUGHT_UP_CONFETTI_COLORS.length]!,
      round,
      spin: -220 + Math.random() * 440,
      delay: Math.random() * 70,
      duration: 1040 + Math.random() * 560,
      gravity: 38 + Math.random() * 52,
    };
  });
}

/** Strong ease-out curve — fast pop, soft settle (common celebration UX). */
export function burstProgress(t: number): number {
  "worklet";
  return 1 - Math.pow(1 - t, 3.1);
}

export function burstOpacity(t: number): number {
  "worklet";
  if (t < 0.48) return 1;
  const fade = (t - 0.48) / 0.52;
  // Ease-out: opacity drops quickly at first, then lingers softly toward zero.
  return Math.max(0, 1 - Math.pow(fade, 2.8));
}

export function burstScale(t: number): number {
  "worklet";
  if (t < 0.09) return 0.25 + (t / 0.09) * 0.85;
  if (t < 0.18) return 1.1 - (t - 0.09) * 0.5;
  if (t < 0.52) return 1;
  const fade = (t - 0.52) / 0.48;
  return Math.max(0.64, 1 - Math.pow(fade, 2.2) * 0.36);
}
