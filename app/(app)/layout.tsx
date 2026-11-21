import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { SessionGate } from "@/components/app/session-gate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate needs="profile">
      <div className="flex min-h-dvh flex-col">
        <AppHeader />
        {children}
      </div>
    </SessionGate>
  );
}
