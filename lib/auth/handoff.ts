import { safeReturnPath } from "./routes";

/**
 * Small notes carried from one sign-in screen to the next.
 *
 * They live in sessionStorage, not in the address bar: an email address in a
 * URL ends up in browser history and server logs. sessionStorage is private to
 * the tab and is cleared when it closes. Everything here is best-effort; a
 * browser that blocks storage simply starts each screen empty.
 */

const RETURN_PATH = "ambrace.auth.return";
const PENDING_EMAIL = "ambrace.auth.email";

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // Storage is unavailable; the flow still works without the note.
  }
}

/** Remember where to go after a Google sign-in, which leaves the site. */
export function rememberReturnPath(path: string | null): void {
  write(RETURN_PATH, safeReturnPath(path));
}

/** Where to go now that sign-in is done. Read once, then forgotten. */
export function takeReturnPath(): string {
  const path = safeReturnPath(read(RETURN_PATH));
  write(RETURN_PATH, null);
  return path;
}

/** The email that still needs its confirmation code. */
export function rememberPendingEmail(email: string): void {
  write(PENDING_EMAIL, email.trim());
}

/** Reading does not clear it, so it is safe to call while rendering. */
export function readPendingEmail(): string {
  return read(PENDING_EMAIL) ?? "";
}

export function clearPendingEmail(): void {
  write(PENDING_EMAIL, null);
}
