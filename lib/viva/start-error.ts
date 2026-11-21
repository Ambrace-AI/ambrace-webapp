import { httpStatus } from "@/lib/api/errors";

/**
 * What to tell a student when a viva will not start. The backend's own wording
 * is written for developers, so it is never shown; the status alone decides.
 */
export function describeStartError(error: unknown): string {
  const status = httpStatus(error);
  if (status === undefined)
    return "We couldn't reach Ambrace. Check your connection and try again.";
  if (status === 401) return "Your session has ended. Sign in again to start.";
  if (status === 429)
    return "You've started several vivas in a short time. Wait a minute, then try again.";
  if (status === 422)
    return "That chapter couldn't be used. Pick it again, or choose another.";
  return "We couldn't start your viva. Try again in a moment.";
}
