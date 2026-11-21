import type { Metadata } from "next";

import { SessionGate } from "@/components/app/session-gate";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Welcome" };

export default function Page() {
  return (
    <SessionGate needs="session">
      <OnboardingFlow />
    </SessionGate>
  );
}
