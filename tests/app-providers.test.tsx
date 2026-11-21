// @vitest-environment jsdom
import { useQuery } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const configureAuth = vi.fn();
const getAccessToken = vi.fn();
vi.mock("@/lib/auth/client", () => ({
  configureAuth: () => configureAuth(),
  getAccessToken: () => getAccessToken(),
}));

const setTokenGetter = vi.fn();
vi.mock("@/lib/api/axios", () => ({
  setTokenGetter: (getter: unknown) => setTokenGetter(getter),
}));

function failure(status: number) {
  return new AxiosError("failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

async function loadProviders() {
  const providers = await import("@/components/providers/app-providers");
  return providers.AppProviders;
}

function Probe({ load }: { load: () => Promise<string> }) {
  const { data, isError } = useQuery({
    queryKey: ["probe"],
    queryFn: load,
    retryDelay: 0,
  });
  if (isError) return <p>failed</p>;
  return <p>{data ?? "loading"}</p>;
}

beforeEach(() => {
  vi.resetModules();
  configureAuth.mockReset();
  getAccessToken.mockReset();
  setTokenGetter.mockReset();
});
afterEach(cleanup);

describe("starting the app in the browser", () => {
  test("sign-in is set up and API calls are given the access token source", async () => {
    await loadProviders();

    expect(configureAuth).toHaveBeenCalledTimes(1);
    expect(setTokenGetter).toHaveBeenCalledTimes(1);

    // The API client is handed a function, so each request fetches a fresh
    // token rather than reusing one captured at start-up.
    getAccessToken.mockResolvedValue("access-token");
    const getter = setTokenGetter.mock.calls[0][0] as () => Promise<string>;
    expect(await getter()).toBe("access-token");
  });
});

describe("loading data", () => {
  test("children can load data", async () => {
    const AppProviders = await loadProviders();

    render(
      <AppProviders>
        <Probe load={async () => "ready"} />
      </AppProviders>,
    );

    await screen.findByText("ready");
  });

  test("a server fault is tried again before giving up", async () => {
    const AppProviders = await loadProviders();
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(failure(503))
      .mockResolvedValue("ready");

    render(
      <AppProviders>
        <Probe load={load} />
      </AppProviders>,
    );

    await screen.findByText("ready");
    expect(load).toHaveBeenCalledTimes(2);
  });

  test("it gives up after three attempts in all", async () => {
    const AppProviders = await loadProviders();
    const load = vi.fn<() => Promise<string>>().mockRejectedValue(failure(503));

    render(
      <AppProviders>
        <Probe load={load} />
      </AppProviders>,
    );

    await screen.findByText("failed");
    expect(load).toHaveBeenCalledTimes(3);
  });

  test.each([401, 404, 422])(
    "a %s is not retried, because trying again cannot fix it",
    async (status) => {
      const AppProviders = await loadProviders();
      const load = vi
        .fn<() => Promise<string>>()
        .mockRejectedValue(failure(status));

      render(
        <AppProviders>
          <Probe load={load} />
        </AppProviders>,
      );

      await screen.findByText("failed");
      await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    },
  );
});
