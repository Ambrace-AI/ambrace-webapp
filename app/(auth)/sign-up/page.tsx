import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  // The form reads the address bar, which is only known in the browser.
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
