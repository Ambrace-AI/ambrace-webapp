/**
 * Which addresses can be seen without signing in, and where to send people.
 *
 * Ambrace has no public pages. Everything except the sign-in screens sits
 * behind the gate in proxy.ts.
 */

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const RESET_PASSWORD_PATH = "/reset-password";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const ONBOARDING_PATH = "/onboarding";
export const HOME_PATH = "/";

/** Screens whose whole purpose is getting signed in. */
const SIGNED_OUT_ONLY = [SIGN_IN_PATH, SIGN_UP_PATH, RESET_PASSWORD_PATH];

/** Reachable while signed out. The callback finishes a Google sign-in. */
const OPEN_PATHS = [...SIGNED_OUT_ONLY, AUTH_CALLBACK_PATH];

function matches(pathname: string, paths: string[]): boolean {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isOpenPath(pathname: string): boolean {
  return matches(pathname, OPEN_PATHS);
}

export function isSignedOutOnlyPath(pathname: string): boolean {
  return matches(pathname, SIGNED_OUT_ONLY);
}

/**
 * The page to return to after signing in.
 *
 * The value comes from the address bar, so anyone can craft it. Only a plain
 * path inside this app is accepted; anything that could leave the site
 * (another host, "//host", a backslash trick, a scheme) falls back to home.
 * Otherwise a link to our sign-in page could bounce a student to a fake one.
 */
export function safeReturnPath(candidate: string | null | undefined): string {
  if (!candidate) return HOME_PATH;
  if (!candidate.startsWith("/")) return HOME_PATH;
  if (candidate.startsWith("//") || candidate.includes("\\")) return HOME_PATH;
  // Control characters are stripped by browsers, which can turn "/\t/host"
  // into "//host".
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return HOME_PATH;

  let parsed: URL;
  try {
    parsed = new URL(candidate, "https://app.invalid");
  } catch {
    return HOME_PATH;
  }
  if (parsed.origin !== "https://app.invalid") return HOME_PATH;
  // Returning to a sign-in screen after signing in would loop.
  if (isOpenPath(parsed.pathname)) return HOME_PATH;

  return `${parsed.pathname}${parsed.search}`;
}

/** The sign-in address that remembers where the person was heading. */
export function signInUrlFor(pathname: string, search = ""): string {
  const destination = safeReturnPath(`${pathname}${search}`);
  if (destination === HOME_PATH) return SIGN_IN_PATH;
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(destination)}`;
}
