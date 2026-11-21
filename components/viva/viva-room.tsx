"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { LiveSession, type VivaScope } from "@/components/viva/live-session";
import { VivaSetup, type VivaChoice } from "@/components/viva/viva-setup";
import { abandonViva, startVivaSession } from "@/lib/api/axios";
import { mapVivaRequest } from "@/lib/curriculum/selection";
import { useMe } from "@/lib/hooks/use-me";
import { useVivaSession } from "@/lib/hooks/useVivaSession";
import { useVivaStore } from "@/lib/store/viva-store";
import { describeStartError } from "@/lib/viva/start-error";
import { SessionState } from "@/types/viva";

/** A viva the server still believes is running. */
const IN_FLIGHT: ReadonlySet<SessionState> = new Set([
  SessionState.STARTING,
  SessionState.ACTIVE,
  SessionState.CONCLUDING,
]);

/**
 * One address, two moments: choosing what to talk about, then talking.
 *
 * They share a page because the live session owns the microphone, the speaker
 * and the connection, and all three must be released the moment the student
 * leaves. Keeping them in one place means leaving the page always cleans up.
 */
export function VivaRoom() {
  const { data: me } = useMe();
  const session = useVivaSession();
  const [scope, setScope] = useState<VivaScope | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Counts departures, so work begun on one visit cannot finish on the next.
  const visit = useRef(0);

  // Leaving ends the visit, however the student leaves. Next keeps this page
  // alive (hidden) after navigation and hands it back as it was, so without
  // this a return would land on the last viva's screen instead of a new start.
  useLayoutEffect(
    () => () => {
      visit.current++;
      const { sessionId, sessionState, conclusionData, error } =
        useVivaStore.getState();
      // A viva still running has nobody in the room: release it on the server.
      if (sessionId && !conclusionData && IN_FLIGHT.has(sessionState))
        void abandonViva(sessionId).catch(() => {});
      useVivaStore.getState().resetSession();
      // When the engine itself sent the student home, the reason goes with them.
      if (error && sessionState === SessionState.IDLE)
        useVivaStore.getState().setError(error);
      setScope(null);
      setStarting(false);
      setStartError(null);
    },
    [],
  );

  const profile = me?.profile;
  if (!profile) return <RoomOutline />;

  async function start({ selection, voiceName }: VivaChoice) {
    const thisVisit = visit.current;
    setStartError(null);
    setStarting(true);
    try {
      // Nothing from an earlier viva may leak into this one.
      session.resetSession();
      const response = await startVivaSession(
        // Name and class come from the profile, never from the form.
        mapVivaRequest(profile!.name, voiceName, selection),
      );
      if (visit.current !== thisVisit) {
        // The student left while the session was being created.
        void abandonViva(response.viva_session_id).catch(() => {});
        return;
      }
      session.setSessionData(response);
      setScope({
        subject: selection.subject_name,
        chapter: selection.chapters[0].name,
      });
      // Asks for the microphone, then connects. Its own failures are shown
      // on the live screen, where the student now is.
      await session.initializeSession();
    } catch (error) {
      if (visit.current === thisVisit) setStartError(describeStartError(error));
    } finally {
      if (visit.current === thisVisit) setStarting(false);
    }
  }

  if (scope) {
    return (
      <LiveSession
        session={session}
        scope={scope}
        onChooseAgain={() => {
          session.resetSession();
          setScope(null);
        }}
      />
    );
  }

  return (
    <VivaSetup
      profile={profile}
      starting={starting}
      error={startError}
      onStart={(choice) => void start(choice)}
    />
  );
}

function RoomOutline() {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-10 px-6 pt-24 pb-12 sm:px-10"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        Getting ready
      </p>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-10 w-72 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
    </main>
  );
}
