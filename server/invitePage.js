function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function requestBaseUrl(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost";
  return `${proto}://${host}`;
}

export function inviteMeta({ hostName, code, memberCount, baseUrl }) {
  const safeHost = hostName || "Someone";
  const title = `Join ${safeHost}'s ReelParty 🎬`;
  const peopleLine =
    memberCount > 1 ? `${memberCount} people waiting · ` : "";
  const description = `${peopleLine}Party code ${code} · Watch TikToks, Reels & Shorts together`;
  const pageUrl = `${baseUrl}/join/${code}`;
  const imageUrl = `${baseUrl}/api/og/${code}.svg`;
  return { title, description, pageUrl, imageUrl, hostName: safeHost, code, memberCount };
}

export function renderInviteHtml(meta) {
  const { title, description, pageUrl, imageUrl, code } = meta;
  const appUrl = `/?join=${encodeURIComponent(code)}`;
  const e = escapeHtml;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ReelParty" />
  <meta property="og:title" content="${e(title)}" />
  <meta property="og:description" content="${e(description)}" />
  <meta property="og:url" content="${e(pageUrl)}" />
  <meta property="og:image" content="${e(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${e(title)}" />
  <meta name="twitter:description" content="${e(description)}" />
  <meta name="twitter:image" content="${e(imageUrl)}" />
  <meta name="theme-color" content="#0a0a0f" />
  <link rel="canonical" href="${e(pageUrl)}" />
  <meta http-equiv="refresh" content="0;url=${e(appUrl)}" />
  <script>window.location.replace(${JSON.stringify(appUrl)})</script>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0a0a0f;
      color: #9898a8;
      font: 700 16px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
  </style>
</head>
<body>
  <p>Opening ReelParty…</p>
</body>
</html>`;
}

export function renderOgSvg({ hostName, code, memberCount }) {
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
    <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#5ecfff"/>
      <stop offset="100%" stop-color="#1899d6"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
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
  <text x="120" y="545" fill="#6b6b7b" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="24" font-weight="700">TikTok · Reels · YouTube Shorts</text>
  <g transform="translate(880, 330)" filter="url(#glow)">
    <rect x="0" y="0" width="180" height="120" rx="18" fill="url(#blue)"/>
    <polygon points="70,35 70,85 115,60" fill="#fff"/>
    <rect x="20" y="20" width="140" height="12" rx="6" fill="#fff" opacity="0.35"/>
    <rect x="20" y="88" width="90" height="12" rx="6" fill="#fff" opacity="0.35"/>
  </g>
  <text x="970" y="510" fill="#ececf1" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="72" text-anchor="middle">🎬</text>
</svg>`;
}

export function renderDefaultOgSvg() {
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
  <text x="600" y="220" fill="#ececf1" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="72" font-weight="800" text-anchor="middle">ReelParty 🎬</text>
  <text x="600" y="300" fill="#9898a8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="34" font-weight="700" text-anchor="middle">Watch TikToks, Reels &amp; Shorts together</text>
  <text x="600" y="420" fill="#1cb0f6" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="48" font-weight="800" text-anchor="middle">Join the party</text>
</svg>`;
}
