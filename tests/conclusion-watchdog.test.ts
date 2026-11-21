import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  CONCLUSION_PATIENCE_MS,
  createConclusionWatchdog,
} from "@/lib/hooks/viva/conclusion-watchdog";

function watchdog(settled = () => false) {
  const askAgain = vi.fn();
  const giveUp = vi.fn();
  const dog = createConclusionWatchdog({
    isSettled: settled,
    askAgain,
    giveUp,
  });
  return { dog, askAgain, giveUp };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("a requested ending", () => {
  test("is left alone while the examiner still has time", () => {
    const { dog, askAgain, giveUp } = watchdog();
    dog.start();

    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS - 1);

    expect(askAgain).not.toHaveBeenCalled();
    expect(giveUp).not.toHaveBeenCalled();
  });

  test("is asked for once more when no report has come", () => {
    const { dog, askAgain, giveUp } = watchdog();
    dog.start();

    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS);

    expect(askAgain).toHaveBeenCalledTimes(1);
    expect(giveUp).not.toHaveBeenCalled();
  });

  test("is given up when the second wait also passes", () => {
    const { dog, askAgain, giveUp } = watchdog();
    dog.start();

    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS * 2);

    expect(askAgain).toHaveBeenCalledTimes(1);
    expect(giveUp).toHaveBeenCalledTimes(1);
    // And it is over: nothing fires again however long the page stays open.
    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS * 10);
    expect(giveUp).toHaveBeenCalledTimes(1);
  });

  test("a report that is being saved is never interrupted", () => {
    const { dog, askAgain, giveUp } = watchdog(() => true);
    dog.start();

    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS * 3);

    expect(askAgain).not.toHaveBeenCalled();
    expect(giveUp).not.toHaveBeenCalled();
  });

  test("a report that arrives after the second request stops the give-up", () => {
    let settled = false;
    const { dog, giveUp } = watchdog(() => settled);
    dog.start();
    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS);

    settled = true;
    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS);

    expect(giveUp).not.toHaveBeenCalled();
  });

  test("stopping cancels the wait, and starting again starts it over", () => {
    const { dog, askAgain } = watchdog();
    dog.start();
    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS - 1);
    dog.stop();
    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS);
    expect(askAgain).not.toHaveBeenCalled();

    dog.start();
    dog.start();
    vi.advanceTimersByTime(CONCLUSION_PATIENCE_MS);
    expect(askAgain).toHaveBeenCalledTimes(1);
  });

  test("the wait can be shortened", () => {
    const giveUp = vi.fn();
    const dog = createConclusionWatchdog({
      isSettled: () => false,
      askAgain: () => undefined,
      giveUp,
      patienceMs: 10,
    });
    dog.start();

    vi.advanceTimersByTime(20);

    expect(giveUp).toHaveBeenCalledTimes(1);
  });
});
