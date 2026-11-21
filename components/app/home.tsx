"use client";

import { useMe } from "@/lib/hooks/use-me";
import { BOARD_LABELS } from "@/types/profile";

/**
 * The signed-in home. For now it confirms who is signed in and what we know
 * about them; starting a viva and the history list arrive in the next phase.
 */
export function Home() {
  const { data: me } = useMe();
  const profile = me?.profile;
  if (!profile) return <HomeOutline />;

  const firstName = profile.name.split(/\s+/)[0];
  const details = [
    `Class ${profile.class_level}`,
    profile.board ? BOARD_LABELS[profile.board] : null,
    profile.school_name,
  ].filter(Boolean);

  return (
    <main className="animate-rise mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12 sm:px-10 sm:py-16">
      <div className="flex flex-col gap-3">
        <p className="label-mono text-muted-foreground">
          {details.join(" · ")}
        </p>
        <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
          Hello, {firstName}.
        </h1>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <p className="label-mono text-muted-foreground">Coming next</p>
        <h2 className="text-xl">Your first viva</h2>
        <p className="text-muted-foreground">
          Sign-in and your profile are ready. Choosing a chapter and speaking
          with your examiner are being connected in the next build.
        </p>
      </section>
    </main>
  );
}

/**
 * The shape of the home screen while the profile loads: the same blocks in
 * the same places, so nothing jumps when the real content arrives.
 */
function HomeOutline() {
  return (
    <main
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12 sm:px-10 sm:py-16"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        Loading your home screen
      </p>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-11 w-64 animate-pulse rounded bg-muted sm:h-12" />
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
    </main>
  );
}
