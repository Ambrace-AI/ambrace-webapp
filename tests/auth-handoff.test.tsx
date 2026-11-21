// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  clearPendingEmail,
  readPendingEmail,
  rememberPendingEmail,
  rememberReturnPath,
  takeReturnPath,
} from "@/lib/auth/handoff";
import { useCooldown } from "@/lib/hooks/use-cooldown";

beforeEach(() => window.sessionStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("remembering where to go after a Google sign-in", () => {
  test("the page is handed back once, then forgotten", () => {
    rememberReturnPath("/v/123");

    expect(takeReturnPath()).toBe("/v/123");
    expect(takeReturnPath()).toBe("/");
  });

  test("only a page inside the app is ever stored", () => {
    rememberReturnPath("https://evil.example");

    expect(window.sessionStorage.getItem("ambrace.auth.return")).toBe("/");
  });

  test("a note tampered with in storage is not trusted either", () => {
    window.sessionStorage.setItem("ambrace.auth.return", "//evil.example");

    expect(takeReturnPath()).toBe("/");
  });
});

describe("remembering the email that still needs its code", () => {
  test("it can be read more than once, until it is cleared", () => {
    rememberPendingEmail("  asha@example.com ");

    expect(readPendingEmail()).toBe("asha@example.com");
    expect(readPendingEmail()).toBe("asha@example.com");
    clearPendingEmail();
    expect(readPendingEmail()).toBe("");
  });
});

describe("a browser that blocks storage", () => {
  beforeEach(() => {
    const blocked = () => {
      throw new DOMException("denied", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(blocked);
  });

  test("nothing throws; each screen simply starts empty", () => {
    expect(() => rememberReturnPath("/v/123")).not.toThrow();
    expect(() => rememberPendingEmail("asha@example.com")).not.toThrow();
    expect(() => clearPendingEmail()).not.toThrow();
    expect(takeReturnPath()).toBe("/");
    expect(readPendingEmail()).toBe("");
  });
});

describe("the wait before asking for another code", () => {
  test("is idle until started", () => {
    const { result } = renderHook(() => useCooldown(30));

    expect(result.current.active).toBe(false);
    expect(result.current.secondsLeft).toBe(0);
  });

  test("counts down in whole seconds and then ends", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown(30));

    act(() => result.current.start());
    expect(result.current.active).toBe(true);
    expect(result.current.secondsLeft).toBe(30);

    act(() => vi.advanceTimersByTime(10_500));
    expect(result.current.secondsLeft).toBe(20);

    act(() => vi.advanceTimersByTime(20_000));
    expect(result.current.active).toBe(false);
    expect(result.current.secondsLeft).toBe(0);
  });

  test("starting again restarts the full wait", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown(30));

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(25_000));
    act(() => result.current.start());

    expect(result.current.secondsLeft).toBe(30);
  });

  test("stops its timer when the screen goes away", () => {
    vi.useFakeTimers();
    const clear = vi.spyOn(window, "clearInterval");
    const { result, unmount } = renderHook(() => useCooldown(30));

    act(() => result.current.start());
    unmount();

    expect(clear).toHaveBeenCalled();
  });
});
