import { describe, expect, test } from "vitest";

import {
  isOpenPath,
  isSignedOutOnlyPath,
  safeReturnPath,
  signInUrlFor,
} from "@/lib/auth/routes";

describe("which pages can be seen without signing in", () => {
  test.each(["/sign-in", "/sign-up", "/reset-password", "/auth/callback"])(
    "%s is open",
    (path) => {
      expect(isOpenPath(path)).toBe(true);
    },
  );

  test.each(["/", "/onboarding", "/viva", "/v/abc", "/sign-in-help", "/auth"])(
    "%s is behind the gate",
    (path) => {
      expect(isOpenPath(path)).toBe(false);
    },
  );

  test("the Google callback is open but is not a screen to bounce signed-in people from", () => {
    expect(isSignedOutOnlyPath("/auth/callback")).toBe(false);
    expect(isSignedOutOnlyPath("/sign-in")).toBe(true);
  });
});

describe("where to go after signing in", () => {
  test("a page inside the app is kept, with its query", () => {
    expect(safeReturnPath("/v/123")).toBe("/v/123");
    expect(safeReturnPath("/viva?class=9")).toBe("/viva?class=9");
  });

  test("nothing to return to means home", () => {
    expect(safeReturnPath(null)).toBe("/");
    expect(safeReturnPath(undefined)).toBe("/");
    expect(safeReturnPath("")).toBe("/");
  });

  test.each([
    "https://evil.example/steal",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "///evil.example",
  ])("%j cannot send a student to another site", (candidate) => {
    expect(safeReturnPath(candidate)).toBe("/");
  });

  test("returning to a sign-in screen would loop, so it becomes home", () => {
    expect(safeReturnPath("/sign-in")).toBe("/");
    expect(safeReturnPath("/sign-in?next=/sign-in")).toBe("/");
    expect(safeReturnPath("/auth/callback?code=abc")).toBe("/");
  });
});

describe("the sign-in address the gate redirects to", () => {
  test("remembers the page that was asked for", () => {
    expect(signInUrlFor("/v/123")).toBe("/sign-in?next=%2Fv%2F123");
    expect(signInUrlFor("/viva", "?class=9")).toBe(
      "/sign-in?next=%2Fviva%3Fclass%3D9",
    );
  });

  test("stays clean when the destination is just home", () => {
    expect(signInUrlFor("/")).toBe("/sign-in");
  });
});
