# ReelParty Mobile

Expo React Native app. See the [root README](../../README.md) for full setup.

The mobile app talks to the tRPC API served by the web app. The base URL is
resolved in `lib/apiUrl.ts`:

1. `EXPO_PUBLIC_API_URL` if set (use this for production/staging), else
2. the Metro dev-server host on port 3000 (the local Next.js app), else
3. `localhost:3000` (simulator only).

## Local development (from the monorepo root)

```bash
pnpm install
pnpm dev:web      # Next.js on :3000 — serves /api/trpc too
pnpm dev:mobile   # Expo; auto-detects your machine's LAN IP on :3000
```

On a physical device, set the URL explicitly if auto-detection misses:

```bash
EXPO_PUBLIC_API_URL="http://<your-lan-ip>:3000" pnpm dev:mobile
```

## Running on a physical iPhone

Expo Go from the App Store does **not** work: it only supports SDK 54, and
this project is on SDK 56 (Apple hasn't approved Expo's newer releases —
see [Expo's changelog](https://expo.dev/changelog/expo-go-and-app-store-may-2026)).
Use a development build instead. The project already includes
`expo-dev-client` and a generated `ios/` folder.

### One-time setup

1. Plug the iPhone into your Mac and tap "Trust This Computer" on the phone.
2. Build and install (from `apps/mobile`):

```bash
pnpm expo run:ios --device
```

3. If the build fails on code signing, open `ios/ReelParty.xcworkspace` in
   Xcode, and under Signing & Capabilities select your personal team (a free
   Apple ID works — add it in Xcode → Settings → Accounts). Then build/run
   from Xcode or re-run the command above.
4. On the phone, trust the developer certificate: Settings → General →
   VPN & Device Management → tap your Apple ID under "Developer App" → Trust.
5. Enable Developer Mode if prompted: Settings → Privacy & Security →
   Developer Mode, then restart the phone.

With a free Apple ID the install expires after 7 days — just re-run
`pnpm expo run:ios --device` to refresh it.

### Day-to-day

No cable or rebuild needed. From the monorepo root:

```bash
pnpm dev:web      # API on :3000
pnpm dev:mobile   # Metro bundler
```

Open the **ReelParty** dev app on the phone (not Expo Go) and pick the dev
server. Phone and Mac must be on the same Wi-Fi network. Make sure the local
`.env` isn't pointing `EXPO_PUBLIC_API_URL` at production, or the app will
talk to the deployed API instead of your local one.

Rebuild with `pnpm expo run:ios --device` only when native code changes
(new native dependencies, `app.json` native config, SDK upgrades). JS/TS
changes are picked up by Metro as usual.

## Against production

Set in `apps/mobile/.env` (or the `env` block of an EAS build profile):

```bash
EXPO_PUBLIC_API_URL=https://reelparty.vercel.app
EXPO_PUBLIC_WEB_ORIGIN=https://reelparty.vercel.app
```

`EXPO_PUBLIC_*` values are inlined at bundle time — restart Expo with
`npx expo start --clear` after changing them.
