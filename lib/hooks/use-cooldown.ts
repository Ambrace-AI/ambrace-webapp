"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A short wait before an action can be repeated, such as asking for another
 * email code. It stops impatient tapping from using up the daily email
 * allowance, and the countdown tells the student exactly how long is left.
 */
export function useCooldown(seconds: number) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const active = endsAt !== null && now < endsAt;

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [active]);

  const start = useCallback(() => {
    const startedAt = Date.now();
    setNow(startedAt);
    setEndsAt(startedAt + seconds * 1000);
  }, [seconds]);

  return {
    active,
    secondsLeft: active ? Math.ceil((endsAt - now) / 1000) : 0,
    start,
  };
}
