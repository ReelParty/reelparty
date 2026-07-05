"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { trpc, trpcLinks } from "@reelparty/api";
import {
  createSessionStore,
  type KeyValueStore,
  type SessionStore,
} from "@reelparty/shared";
import type { PlatformBridge } from "../platform/bridge";
import { ToastProvider } from "./toast";

interface AppContextValue {
  bridge: PlatformBridge;
  store: KeyValueStore;
  session: SessionStore;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export interface AppProviderProps {
  apiUrl: string;
  store: KeyValueStore;
  bridge: PlatformBridge;
  children: ReactNode;
}

/** Single root provider mounted by both apps/web and apps/mobile. */
export function AppProvider({
  apiUrl,
  store,
  bridge,
  children,
}: AppProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: trpcLinks(apiUrl) }),
  );

  const value = useMemo<AppContextValue>(
    () => ({ bridge, store, session: createSessionStore(store) }),
    [bridge, store],
  );

  return (
    <SafeAreaProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={value}>
            <ToastProvider>{children}</ToastProvider>
          </AppContext.Provider>
        </QueryClientProvider>
      </trpc.Provider>
    </SafeAreaProvider>
  );
}

export { useToast, useToastDismiss } from "./toast-context";
export { ToastProvider } from "./toast";
