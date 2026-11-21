import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  // The form reads the address bar, which is only known in the browser.
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
