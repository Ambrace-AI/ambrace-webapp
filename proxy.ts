import { NextResponse, type NextRequest } from "next/server";

import {
  isOpenPath,
  isSignedOutOnlyPath,
  safeReturnPath,
  signInUrlFor,
} from "@/lib/auth/routes";
import { hasValidSession } from "@/lib/auth/server";

/**
 * The front door. Ambrace has no public pages, so this runs before every page
 * and decides one thing: signed in, or not.
 *
 * - Not signed in, asking for anything but a sign-in screen: go to sign-in,
 *   remembering where they were heading.
 * - Signed in, asking for a sign-in screen: go to where they were heading.
 *
 * This keeps the app out of sight, but it is not what protects data. Every API
 * call is checked again by the backend against the access token.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const response = NextResponse.next();
  const signedIn = await hasValidSession(request, response);

  if (!signedIn && !isOpenPath(pathname)) {
    return NextResponse.redirect(
      new URL(signInUrlFor(pathname, search), request.url),
    );
  }
  if (signedIn && isSignedOutOnlyPath(pathname)) {
    return NextResponse.redirect(
      new URL(safeReturnPath(searchParams.get("next")), request.url),
    );
  }
  return response;
}

export const config = {
  // Pages only. Next.js internals and the files in public/ (icons, logo, the
  // audio worklets) carry nothing private and are skipped for speed.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|svg|png|webmanifest|js)$).*)",
  ],
};
