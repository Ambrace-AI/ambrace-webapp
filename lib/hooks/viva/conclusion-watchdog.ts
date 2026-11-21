/**
 * A requested ending must end.
 *
 * Asking the examiner to wrap up is a request, not a guarantee: the report
 * arrives only if the model calls its tool. This gives that request a bounded
 * life. If no report has arrived after one wait, the examiner is asked once
 * more; if none has arrived after a second, the session is given up so the
 * student is never left watching a spinner.
 */
export const CONCLUSION_PATIENCE_MS = 15_000;

interface ConclusionWatchdogDependencies {
  /** True once a report is being saved or has been saved. */
  isSettled: () => boolean;
  askAgain: () => void;
  giveUp: () => void;
  patienceMs?: number;
}

export function createConclusionWatchdog(deps: ConclusionWatchdogDependencies) {
  const patienceMs = deps.patienceMs ?? CONCLUSION_PATIENCE_MS;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const waitThen = (onExpiry: () => void) => {
    timer = setTimeout(() => {
      timer = null;
      if (!deps.isSettled()) onExpiry();
    }, patienceMs);
  };

  return {
    start: () => {
      stop();
      waitThen(() => {
        deps.askAgain();
        waitThen(deps.giveUp);
      });
    },
    stop,
  };
}
