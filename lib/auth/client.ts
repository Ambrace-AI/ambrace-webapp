import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";

import { buildAuthConfig, readAuthEnvironment } from "./config";

let configured = false;

/**
 * Points the Amplify library at our Cognito user pool. Safe to call often.
 *
 * `ssr: true` keeps the session in cookies instead of localStorage, which is
 * what lets the server-side gate (proxy.ts) see whether someone is signed in
 * before any page is sent.
 */
export function configureAuth(): void {
  if (configured) return;
  Amplify.configure(buildAuthConfig(readAuthEnvironment()), { ssr: true });
  configured = true;
}

/**
 * The access token for API calls, or null when nobody is signed in.
 *
 * Called before every request rather than cached by us: the library hands back
 * the stored token while it is valid and quietly swaps in a fresh one when it
 * has expired, so a long viva never fails on a stale token.
 *
 * The backend accepts the access token only, never the ID token.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    configureAuth();
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}
