import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import {
  createTRPCClient as createVanillaClient,
  httpBatchLink,
  type TRPCLink,
} from "@trpc/client";
import type {
  inferRouterInputs,
  inferRouterOutputs,
} from "@trpc/server";
// Type-only import: erased at build time, so the Postgres/server code never
// leaks into web or native client bundles.
import type { AppRouter } from "./server/router";

export type { AppRouter };
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/** React Query bound tRPC hooks, shared by web + native. */
// Explicit annotation keeps the emitted type portable across packages (TS2742).
export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();

function normalizeBase(apiUrl: string): string {
  return `${apiUrl.replace(/\/$/, "")}/api/trpc`;
}

export function trpcLinks(apiUrl: string): TRPCLink<AppRouter>[] {
  return [httpBatchLink({ url: normalizeBase(apiUrl) })];
}

/** Vanilla (non-React) client, handy for SSR / one-off calls. */
export function createTrpcClient(apiUrl: string) {
  return createVanillaClient<AppRouter>({ links: trpcLinks(apiUrl) });
}
