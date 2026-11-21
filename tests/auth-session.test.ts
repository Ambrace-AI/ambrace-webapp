import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const configure = vi.fn();
vi.mock("aws-amplify", () => ({ Amplify: { configure } }));

const fetchBrowserSession = vi.fn();
vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: () => fetchBrowserSession(),
}));

const fetchServerSession = vi.fn();
vi.mock("aws-amplify/auth/server", () => ({
  fetchAuthSession: (context: unknown) => fetchServerSession(context),
}));

const createServerRunner = vi.fn();
vi.mock("@aws-amplify/adapter-nextjs", () => ({
  createServerRunner: (input: unknown) => createServerRunner(input),
}));

const SETTINGS = {
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: "ap-south-1_example",
  NEXT_PUBLIC_COGNITO_CLIENT_ID: "client123",
  NEXT_PUBLIC_COGNITO_DOMAIN: "ambrace-dev.auth.ap-south-1.amazoncognito.com",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

function configureEnvironment(settings: Record<string, string> = SETTINGS) {
  for (const name of Object.keys(SETTINGS)) vi.stubEnv(name, "");
  for (const [name, value] of Object.entries(settings)) vi.stubEnv(name, value);
}

beforeEach(() => {
  // Both modules remember that they have been set up; start each test fresh.
  vi.resetModules();
  configure.mockReset();
  fetchBrowserSession.mockReset();
  fetchServerSession.mockReset();
  createServerRunner.mockReset();
  createServerRunner.mockImplementation(() => ({
    runWithAmplifyServerContext: ({
      operation,
    }: {
      operation: (context: string) => unknown;
    }) => operation("server-context"),
  }));
  configureEnvironment();
});
afterEach(() => vi.unstubAllEnvs());

describe("the access token used for API calls", () => {
  test("is the access token, never the ID token", async () => {
    fetchBrowserSession.mockResolvedValue({
      tokens: {
        accessToken: { toString: () => "access-token" },
        idToken: { toString: () => "id-token" },
      },
    });
    const { getAccessToken } = await import("@/lib/auth/client");

    expect(await getAccessToken()).toBe("access-token");
  });

  test("is null when nobody is signed in", async () => {
    fetchBrowserSession.mockResolvedValue({ tokens: undefined });
    const { getAccessToken } = await import("@/lib/auth/client");

    expect(await getAccessToken()).toBeNull();
  });

  test("is null, not an exception, when the session cannot be read", async () => {
    fetchBrowserSession.mockRejectedValue(new Error("storage blocked"));
    const { getAccessToken } = await import("@/lib/auth/client");

    expect(await getAccessToken()).toBeNull();
  });

  test("is null when sign-in is not configured, instead of crashing the caller", async () => {
    configureEnvironment({});
    const { getAccessToken } = await import("@/lib/auth/client");

    expect(await getAccessToken()).toBeNull();
    expect(fetchBrowserSession).not.toHaveBeenCalled();
  });

  test("is asked for afresh on every call, so an expired token is replaced", async () => {
    fetchBrowserSession
      .mockResolvedValueOnce({
        tokens: { accessToken: { toString: () => "first" } },
      })
      .mockResolvedValueOnce({
        tokens: { accessToken: { toString: () => "refreshed" } },
      });
    const { getAccessToken } = await import("@/lib/auth/client");

    expect(await getAccessToken()).toBe("first");
    expect(await getAccessToken()).toBe("refreshed");
  });
});

describe("setting up the sign-in library in the browser", () => {
  test("happens once, with the session kept in cookies for the server gate", async () => {
    const { configureAuth } = await import("@/lib/auth/client");

    configureAuth();
    configureAuth();

    expect(configure).toHaveBeenCalledTimes(1);
    const [config, options] = configure.mock.calls[0];
    expect(config.Auth.Cognito.userPoolClientId).toBe("client123");
    expect(options).toEqual({ ssr: true });
  });

  test("names the missing setting when sign-in is not configured", async () => {
    configureEnvironment({ ...SETTINGS, NEXT_PUBLIC_COGNITO_DOMAIN: "" });
    const { configureAuth } = await import("@/lib/auth/client");

    expect(() => configureAuth()).toThrow(/NEXT_PUBLIC_COGNITO_DOMAIN/);
  });
});

describe("checking the session on the server", () => {
  const request = () => new NextRequest("http://localhost:3000/");

  test("a verified access token counts as signed in", async () => {
    fetchServerSession.mockResolvedValue({
      tokens: { accessToken: { toString: () => "access-token" } },
    });
    const { hasValidSession } = await import("@/lib/auth/server");

    expect(await hasValidSession(request(), NextResponse.next())).toBe(true);
    expect(fetchServerSession).toHaveBeenCalledWith("server-context");
  });

  test("no tokens means not signed in", async () => {
    fetchServerSession.mockResolvedValue({ tokens: undefined });
    const { hasValidSession } = await import("@/lib/auth/server");

    expect(await hasValidSession(request(), NextResponse.next())).toBe(false);
  });

  test("a check that breaks never lets anyone through", async () => {
    fetchServerSession.mockRejectedValue(new Error("invalid signature"));
    const { hasValidSession } = await import("@/lib/auth/server");

    expect(await hasValidSession(request(), NextResponse.next())).toBe(false);
  });

  test("with sign-in not configured, nobody counts as signed in", async () => {
    configureEnvironment({});
    const { hasValidSession } = await import("@/lib/auth/server");

    expect(await hasValidSession(request(), NextResponse.next())).toBe(false);
    expect(createServerRunner).not.toHaveBeenCalled();
  });

  test("the server runner is built once and reused", async () => {
    fetchServerSession.mockResolvedValue({ tokens: undefined });
    const { hasValidSession } = await import("@/lib/auth/server");

    await hasValidSession(request(), NextResponse.next());
    await hasValidSession(request(), NextResponse.next());

    expect(createServerRunner).toHaveBeenCalledTimes(1);
  });
});
