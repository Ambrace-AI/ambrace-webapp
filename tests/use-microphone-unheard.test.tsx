// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { UNHEARD_AFTER_SECONDS } from "@/lib/viva/microphone-health";

const microphone = vi.hoisted(() => ({
  packets: 0,
  flowing: true,
  rmsDbfs: -30 as number | null,
}));
vi.mock("@/lib/telemetry/voice-telemetry", () => ({
  voiceTelemetry: {
    getSnapshot: () => {
      if (microphone.flowing) microphone.packets += 50;
      return {
        totalInputPackets: microphone.packets,
        microphoneLevel:
          microphone.rmsDbfs === null ? null : { rmsDbfs: microphone.rmsDbfs },
      };
    },
  },
}));

import { useMicrophoneUnheard } from "@/lib/hooks/use-microphone-unheard";

const pass = (seconds: number) =>
  act(() => void vi.advanceTimersByTime(seconds * 1000));

beforeEach(() => {
  vi.useFakeTimers();
  microphone.packets = 0;
  microphone.flowing = true;
  microphone.rmsDbfs = -30;
});
afterEach(() => vi.useRealTimers());

describe("noticing a microphone that is not reaching us", () => {
  test("a student who can be heard is never told otherwise", () => {
    const { result } = renderHook(() => useMicrophoneUnheard(true));

    pass(UNHEARD_AFTER_SECONDS * 3);

    expect(result.current).toBe(false);
  });

  test("a silent microphone is noticed after several seconds, not at once", () => {
    microphone.rmsDbfs = -120;
    const { result } = renderHook(() => useMicrophoneUnheard(true));

    pass(UNHEARD_AFTER_SECONDS);
    expect(result.current).toBe(false);

    pass(1);
    expect(result.current).toBe(true);
  });

  test("audio that stops leaving the browser is noticed too", () => {
    microphone.flowing = false;
    const { result } = renderHook(() => useMicrophoneUnheard(true));

    pass(UNHEARD_AFTER_SECONDS + 1);

    expect(result.current).toBe(true);
  });

  test("it clears as soon as sound returns", () => {
    microphone.rmsDbfs = -120;
    const { result } = renderHook(() => useMicrophoneUnheard(true));
    pass(UNHEARD_AFTER_SECONDS + 1);
    expect(result.current).toBe(true);

    microphone.rmsDbfs = -30;
    pass(1);

    expect(result.current).toBe(false);
  });

  test("nothing is measured while it is not the student's turn", () => {
    microphone.flowing = false;
    const { result } = renderHook(() => useMicrophoneUnheard(false));

    pass(UNHEARD_AFTER_SECONDS * 2);

    expect(result.current).toBe(false);
    expect(microphone.packets).toBe(0);
  });

  test("each turn is judged afresh", () => {
    microphone.rmsDbfs = -120;
    const { result, rerender } = renderHook(
      ({ listening }) => useMicrophoneUnheard(listening),
      { initialProps: { listening: true } },
    );
    pass(UNHEARD_AFTER_SECONDS + 1);
    expect(result.current).toBe(true);

    rerender({ listening: false });
    expect(result.current).toBe(false);

    rerender({ listening: true });
    expect(result.current).toBe(false);
    pass(UNHEARD_AFTER_SECONDS);
    expect(result.current).toBe(false);
  });
});
