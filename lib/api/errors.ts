import { isAxiosError } from "axios";

/** The HTTP status behind a failed API call, if the server answered at all. */
export function httpStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) return error.response?.status;
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

/** True when retrying could plausibly help: no answer, or a server fault. */
export function isWorthRetrying(error: unknown): boolean {
  const status = httpStatus(error);
  return status === undefined || status >= 500;
}

/** True when the session is no longer accepted and the person must sign in. */
export function isSignedOutError(error: unknown): boolean {
  return httpStatus(error) === 401;
}
