import type { ReactNode } from "react";

import { SessionGate } from "@/components/app/session-gate";

/**
 * The viva has its own frame, without the site header. During a spoken exam a
 * "Sign out" button is only something to hit by mistake, and the setup screen
 * carries its own way home.
 */
export default function VivaLayout({ children }: { children: ReactNode }) {
  return <SessionGate needs="profile">{children}</SessionGate>;
}
