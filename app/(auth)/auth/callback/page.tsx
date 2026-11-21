import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCallback } from "@/components/auth/auth-callback";

export const metadata: Metadata = { title: "Signing you in" };

export default function Page() {
  // The form reads the address bar, which is only known in the browser.
  return (
    <Suspense>
      <AuthCallback />
    </Suspense>
  );
}
