"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { setTokenGetter } from "@/lib/api/axios";
import { isWorthRetrying } from "@/lib/api/errors";
import { configureAuth, getAccessToken } from "@/lib/auth/client";

// Runs once, when the browser first loads the app, before any component asks
// for data. Every API call then picks up a fresh access token by itself.
if (typeof window !== "undefined") {
  configureAuth();
  setTokenGetter(getAccessToken);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            // A 401 or 404 will not fix itself; only retry what might.
            retry: (failureCount, error) =>
              isWorthRetrying(error) && failureCount < 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
