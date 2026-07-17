/** SEO invite-page + Open Graph image rendering (server only). */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface InviteContext {
  hostName: string;
  code: string;
  memberCount: number;
}

const logoOgPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../assets/logo-og.png",
);

function logoDataUri(): string {
  const png = readFileSync(logoOgPath);
  return `data:image/png;base64,${png.toString("base64")}`;
}

export interface InviteMeta {
  title: string;
  description: string;
  pageUrl: string;
  imageUrl: string;
  hostName: string;
  code: string;
  memberCount: number;
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function inviteMeta(
  ctx: InviteContext & { baseUrl: string },
): InviteMeta {
  const safeHost = ctx.hostName || "Someone";
  const title = `Join ${safeHost}'s ReelParty 🎬`;
  const peopleLine = ctx.memberCount > 1 ? `${ctx.memberCount} people waiting · ` : "";
  const description = `${peopleLine}Party code ${ctx.code} · Watch TikToks, Reels, Facebook & Shorts together`;
  const pageUrl = `${ctx.baseUrl}/join/${ctx.code}`;
  const imageUrl = `${ctx.baseUrl}/api/og/${ctx.code}.svg`;
  return {
    title,
    description,
    pageUrl,
    imageUrl,
    hostName: safeHost,
    code: ctx.code,
    memberCount: ctx.memberCount,
  };
}

export function renderOgSvg({ hostName, code, memberCount }: InviteContext): string {
  const host = escapeXml(hostName || "Someone");
  const partyCode = escapeXml(code);
  const countLabel =
    memberCount > 1
      ? escapeXml(`${memberCount} people in the party`)
      : "Tap to join the watch party";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="55%" stop-color="#12121a"/>
      <stop offset="100%" stop-color="#1a1525"/>
    </linearGradient>
    <linearGradient id="green" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8fe838"/>
      <stop offset="100%" stop-color="#46a302"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="150" cy="120" r="110" fill="#58cc02" opacity="0.12"/>
  <circle cx="1050" cy="520" r="140" fill="#1cb0f6" opacity="0.14"/>
  <circle cx="980" cy="90" r="70" fill="#ce82ff" opacity="0.18"/>
  <rect x="80" y="70" width="1040" height="490" rx="36" fill="#15151c" stroke="#2a2a38" stroke-width="3"/>
  <rect x="80" y="70" width="1040" height="8" rx="4" fill="url(#green)"/>
  <text x="120" y="165" fill="#9898a8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="28" font-weight="700" letter-spacing="6">REELPARTY</text>
  <text x="120" y="250" fill="#ececf1" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="54" font-weight="800">Join ${host}'s party</text>
  <text x="120" y="310" fill="#9898a8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="30" font-weight="700">${countLabel}</text>
  <rect x="120" y="360" width="420" height="120" rx="24" fill="#1c1c26" stroke="#1cb0f6" stroke-width="4"/>
  <text x="330" y="440" fill="#1cb0f6" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="64" font-weight="800" text-anchor="middle" letter-spacing="16">${partyCode}</text>
  <text x="120" y="545" fill="#6b6b7b" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="24" font-weight="700">TikTok · Reels · Facebook · YouTube Shorts</text>
  <image href="${logoDataUri()}" x="860" y="280" width="220" height="220"/>
</svg>`;
}

export function renderDefaultOgSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="100%" stop-color="#1a1525"/>
    </linearGradient>
    <linearGradient id="green" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8fe838"/>
      <stop offset="100%" stop-color="#46a302"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="180" cy="140" r="120" fill="#58cc02" opacity="0.12"/>
  <circle cx="1020" cy="500" r="150" fill="#1cb0f6" opacity="0.14"/>
  <rect x="80" y="80" width="1040" height="470" rx="36" fill="#15151c" stroke="#2a2a38" stroke-width="3"/>
  <rect x="80" y="80" width="1040" height="8" rx="4" fill="url(#green)"/>
  <image href="${logoDataUri()}" x="490" y="120" width="220" height="220"/>
  <text x="600" y="400" fill="#ececf1" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="64" font-weight="800" text-anchor="middle">ReelParty</text>
  <text x="600" y="460" fill="#9898a8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="30" font-weight="700" text-anchor="middle">Watch TikToks, Reels, Facebook &amp; Shorts together</text>
  <text x="600" y="520" fill="#1cb0f6" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="36" font-weight="800" text-anchor="middle">Join the party</text>
</svg>`;
}
