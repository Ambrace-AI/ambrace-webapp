"use client";

import { signOut } from "aws-amplify/auth";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { configureAuth } from "@/lib/auth/client";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

export function AppHeader() {
  const [leaving, setLeaving] = useState(false);

  async function leave() {
    setLeaving(true);
    configureAuth();
    try {
      // For a Google account this also ends the session at the sign-in
      // service, which sends the browser back to the sign-in screen itself.
      await signOut();
    } catch {
      // Offline or already signed out: leaving the app is still what was
      // asked for, and the sign-in screen is the right place to land.
    } finally {
      window.location.assign(SIGN_IN_PATH);
    }
  }

  return (
    <header className="border-b border-border">
      {/* Held to a readable width so the logo and the sign-out button stay
          near the content on a very wide monitor, not at its far edges. */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
        <Logo surface="paper" priority />
        <Button
          variant="ghost"
          size="touch"
          onClick={leave}
          disabled={leaving}
          aria-busy={leaving}
        >
          {leaving ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOutIcon className="size-4" aria-hidden="true" />
          )}
          Sign out
        </Button>
      </div>
    </header>
  );
}
