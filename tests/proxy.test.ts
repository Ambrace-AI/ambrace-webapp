import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const hasValidSession = vi.fn();
vi.mock("@/lib/auth/server", () => ({
  hasValidSession: (...input: unknown[]) => hasValidSession(...input),
}));

import { config, proxy } from "@/proxy";

async function visit(path: string, signedIn: boolean) {
  hasValidSession.mockResolvedValue(signedIn);
  const response = await proxy(new NextRequest(`http://localhost:3000${path}`));
  const location = response.headers.get("location");
  return {
    status: response.status,
    // Path and query only, so the assertions read like addresses.
    redirect: location ? location.replace("http://localhost:3000", "") : null,
  };
}

beforeEach(() => hasValidSession.mockReset());

describe("signed out", () => {
  test.each(["/", "/onboarding", "/viva", "/v/abc123"])(
    "%s is not shown; the visitor is sent to sign in",
    async (path) => {
      const { status, redirect } = await visit(path, false);

      expect(status).toBe(307);
      expect(redirect).toMatch(/^\/sign-in/);
    },
  );

  test("the page asked for is remembered", async () => {
    expect((await visit("/v/abc123", false)).redirect).toBe(
      "/sign-in?next=%2Fv%2Fabc123",
    );
    expect((await visit("/viva?class=9", false)).redirect).toBe(
      "/sign-in?next=%2Fviva%3Fclass%3D9",
    );
  });

  test("home needs no reminder", async () => {
    expect((await visit("/", false)).redirect).toBe("/sign-in");
  });

  test.each(["/sign-in", "/sign-up", "/reset-password", "/auth/callback"])(
    "%s is shown",
    async (path) => {
      const { status, redirect } = await visit(path, false);

      expect(status).toBe(200);
      expect(redirect).toBeNull();
    },
  );
});

describe("signed in", () => {
  test.each(["/", "/onboarding", "/v/abc123"])("%s is shown", async (path) => {
    const { status, redirect } = await visit(path, true);

    expect(status).toBe(200);
    expect(redirect).toBeNull();
  });

  test.each(["/sign-in", "/sign-up", "/reset-password"])(
    "%s is skipped, since there is nothing to do there",
    async (path) => {
      expect((await visit(path, true)).redirect).toBe("/");
    },
  );

  test("the sign-in screen forwards to the page that was remembered", async () => {
    expect((await visit("/sign-in?next=%2Fv%2Fabc123", true)).redirect).toBe(
      "/v/abc123",
    );
  });

  test("a crafted return address cannot forward to another site", async () => {
    expect(
      (await visit("/sign-in?next=https%3A%2F%2Fevil.example", true)).redirect,
    ).toBe("/");
    expect(
      (await visit("/sign-in?next=%2F%2Fevil.example", true)).redirect,
    ).toBe("/");
  });

  test("the Google callback is left alone so it can finish", async () => {
    expect((await visit("/auth/callback?code=abc", true)).redirect).toBeNull();
  });
});

describe("which requests the gate looks at", () => {
  const pattern = new RegExp(`^${config.matcher[0]}$`);

  test.each(["/", "/sign-in", "/onboarding", "/v/abc123"])(
    "%s is a page, so it is checked",
    (path) => {
      expect(pattern.test(path)).toBe(true);
    },
  );

  test.each([
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
    "/favicon.svg",
    "/apple-touch-icon.png",
    "/site.webmanifest",
    "/brand/ambrace-mark.svg",
    "/audio-worklet-processor.js",
    "/audio-output-worklet.js",
  ])("%s is a public file, so it is skipped", (path) => {
    expect(pattern.test(path)).toBe(false);
  });
});
