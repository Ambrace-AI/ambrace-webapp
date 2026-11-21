"use client";

import { useSessionTimer } from "@/lib/hooks/useSessionTimer";
import { cn } from "@/lib/utils";

/**
 * Time left, kept small and out of the way.
 *
 * A large countdown turns a conversation into a race. This one sits in the
 * corner until it matters: amber for the last two minutes, red for the last
 * one, each with words so colour is never the only signal. When the time runs
 * out the examiner is asked to wrap up, exactly as if the student had finished.
 */
export function SessionClock({ onTimeLimit }: { onTimeLimit: () => void }) {
  const { formattedTime, isWarning, isUrgent } = useSessionTimer(onTimeLimit);

  return (
    <p
      className={cn(
        "label-mono flex items-center gap-2 tabular-nums",
        isUrgent
          ? "text-destructive"
          : isWarning
            ? "text-warning"
            : "text-muted-foreground",
      )}
    >
      {isWarning ? (
        <span>{isUrgent ? "Ending soon" : "Almost time"}</span>
      ) : null}
      <span role="timer" aria-label="Time left">
        {formattedTime}
      </span>
    </p>
  );
}
