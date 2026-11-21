"use client";

import { useQuery } from "@tanstack/react-query";

import { getVivaSession } from "@/lib/api/axios";

/** One finished (or unfinished) viva, with its report if there is one. */
export function useVivaResult(sessionId: string) {
  return useQuery({
    queryKey: ["viva-session", sessionId],
    queryFn: () => getVivaSession(sessionId),
    // A report never changes once it is written; until then, ask again.
    staleTime: (query) => (query.state.data?.feedback ? Infinity : 0),
  });
}
