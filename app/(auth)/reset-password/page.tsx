import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function Page() {
  // The form reads the address bar, which is only known in the browser.
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
