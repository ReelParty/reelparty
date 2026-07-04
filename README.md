# ReelParty

Watch TikToks, Reels, Facebook & YouTube Shorts together with friends — build a shared
queue, react with emojis, and see who watched what.

A **universal monorepo**: a Next.js web app and an Expo iOS/Android app that
share ~all of their logic, types, data fetching, validation, and UI.

## Architecture

```
reelparty/
├─ apps/
│  ├─ web/      Next.js 15 (App Router, RSC) + react-native-web + NativeWind
│  └─ mobile/   Expo + Expo Router + React Native + NativeWind
├─ packages/
│  ├─ shared/   Types, Zod schemas, pure business logic, storage interface
│  ├─ api/      tRPC router + MongoDB layer (server) and tRPC client (client)
│  ├─ ui/       Cross-platform NativeWind components (Button, Card, Avatar, …)
│  ├─ app/      Shared screens, providers, Solito navigation, platform bridges
│  └─ config/   Shared ESLint flat config + Tailwind/NativeWind design preset
└─ turbo.json, pnpm-workspace.yaml, tsconfig.base.json
```

**What's shared vs. platform-specific**

- Shared: every screen, the tRPC API + client, TanStack Query setup, Zod
  validation, business logic (reactions, queue sorting, avatars), navigation
  intent (`useAppNavigation` via Solito), and styling tokens.
- Web-only: Next.js routing, RSC SEO/invite metadata + Open Graph image route,
  the tRPC HTTP handler, and the localStorage/Web-Share platform bridge.
- Native-only: Expo Router file routes, font loading, and the
  AsyncStorage/Expo-clipboard/Share platform bridge.

Platform differences are injected at the root via an `AppProvider` that takes a
`PlatformBridge` and a `KeyValueStore`, so the shared screens stay identical.

## Tech

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** Next.js 15 App Router, React Server Components, react-native-web
- **Mobile:** Expo SDK 56, Expo Router, React Native (New Architecture)
- **Styling:** NativeWind v4 (Tailwind) with a shared design preset
- **API:** tRPC v11 + MongoDB, end-to-end typed; TanStack Query for data
- **Navigation:** Solito (one route map for both platforms)
- **Quality:** TypeScript (strict), ESLint (flat), Prettier, Conventional Commits

## Prerequisites

- Node 20+ and `pnpm` 9 (`corepack enable`)
- MongoDB (default `mongodb://127.0.0.1:27017`)
- For mobile: [Expo Go](https://expo.dev/go) or an iOS Simulator / Android Emulator

## Install

```bash
pnpm install
```

## Configuration

| Variable                | Used by | Purpose                                                |
| ----------------------- | ------- | ------------------------------------------------------ |
| `MONGODB_URI`           | web     | Mongo connection string (default local)                |
| `MONGODB_DB`            | web     | Database name (default `reelparty`)                    |
| `NEXT_PUBLIC_API_URL`   | web     | tRPC origin; empty = same origin (`/api/trpc`)         |
| `NEXT_PUBLIC_WEB_ORIGIN`| web     | Absolute origin for OG/invite metadata                 |
| `EXPO_PUBLIC_API_URL`   | mobile  | tRPC origin (the running web app), e.g. `http://IP:3000` |
| `EXPO_PUBLIC_WEB_ORIGIN`| mobile  | Origin used to build shareable invite links            |

The API now lives **inside the web app** as tRPC route handlers
(`apps/web/app/api/trpc/[trpc]`), so running the web app also serves the API for
mobile.

## Development

Run web + mobile together (Turbo TUI — keyboard input goes to the focused task):

```bash
pnpm dev
```

In the Turbo terminal UI, use **↑/↓** to focus a task pane, then use that app's
shortcuts (e.g. **`i`** opens the iOS simulator when the **mobile** pane is
focused). Press **`m`** in the mobile pane for the full Expo dev menu.

Or run one app directly (full terminal control, no Turbo UI):

```bash
pnpm dev:web      # Next.js at http://localhost:3000 (serves /api/trpc too)
pnpm dev:mobile   # Expo dev server — `i` / `a` / `r` work immediately
```

### Mobile pointing at your machine

The mobile app talks to the web app's tRPC API. By default it auto-detects the
Metro host and uses `http://<your-LAN-ip>:3000`. To be explicit (recommended on
a physical device):

```bash
# 1) start the web app (which hosts the API)
pnpm dev:web
# 2) in another shell, start mobile pointed at your machine
EXPO_PUBLIC_API_URL="http://192.168.1.20:3000" pnpm dev:mobile
```

## Quality scripts

```bash
pnpm typecheck   # tsc --noEmit across every package
pnpm lint        # eslint across every package
pnpm format      # prettier --write
pnpm build       # turbo build (currently the Next.js web app)
```

## Deployment

- **Web → Vercel:** set the project root to `apps/web`. Vercel detects Next.js;
  set `MONGODB_URI`, `MONGODB_DB`, and `NEXT_PUBLIC_WEB_ORIGIN`.
- **Mobile → Expo EAS:** from `apps/mobile`, run `eas build` (configure your EAS
  project first) and set `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_WEB_ORIGIN` to your
  deployed web origin.

## Working in the monorepo

### Add shared code

Put cross-platform logic/types in `packages/shared`, API procedures in
`packages/api`, reusable visual components in `packages/ui`, and full screens or
providers in `packages/app`. Export new modules from each package's
`src/index.ts`. Imports use the package name, e.g.:

```ts
import { sortQueue } from "@reelparty/shared";
import { trpc } from "@reelparty/api";
import { Button, Card } from "@reelparty/ui";
import { PartyScreen, useAppNavigation } from "@reelparty/app";
```

### Platform-specific files

When a single component needs different web vs. native implementations, use
platform extensions — Metro and the Next webpack config resolve them
automatically:

```
MyThing.tsx          # shared default
MyThing.web.tsx      # web override (react-native-web / DOM)
MyThing.native.tsx   # iOS + Android override
MyThing.ios.tsx      # iOS only (optional)
MyThing.android.tsx  # Android only (optional)
```

Prefer keeping logic shared and pushing only the differing piece behind a
platform file or the `PlatformBridge`.

### Add a screen / route

1. Build the screen in `packages/app/src/features/...` and export it.
2. Add the web route in `apps/web/app/...` (a thin `"use client"` wrapper or an
   RSC page for SEO).
3. Add the matching Expo Router file in `apps/mobile/app/...`.
4. Add navigation helpers to `useAppNavigation` so both platforms share intent.

## Notes

- Web and mobile share one tRPC API and one MongoDB database.
- Clipboard auto-read works on localhost/HTTPS; over a plain LAN IP browsers
  block it, so guests use the paste sheet.
- YouTube Shorts fetch real metadata and play embedded. TikTok/Reels/Facebook show
  platform cards (in-app playback needs each platform's SDK).
- Invite links resolve to `/join/<code>`, which is an RSC page on web with full
  Open Graph metadata and a generated share image at `/api/og/<code>.svg`.
