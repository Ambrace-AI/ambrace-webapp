import { describe, expect, test } from "vitest";

import {
  SAMPLE_WINDOW,
  SILENCE_DBFS,
  isUnheard,
  type MicrophoneSample,
} from "@/lib/viva/microphone-health";

/** One sample a second: fifty packets a second, at speaking volume, unless told otherwise. */
const seconds = (
  count: number,
  each: (second: number) => Partial<MicrophoneSample> = () => ({}),
): MicrophoneSample[] =>
  Array.from({ length: count }, (_, second) => ({
    packetsSent: second * 50,
    rmsDbfs: -30,
    ...each(second),
  }));

describe("whether the microphone is reaching us", () => {
  test("a voice arriving normally is heard", () => {
    expect(isUnheard(seconds(SAMPLE_WINDOW))).toBe(false);
  });

  test("nothing is concluded before enough time has passed", () => {
    expect(
      isUnheard(seconds(SAMPLE_WINDOW - 1, () => ({ rmsDbfs: -120 }))),
    ).toBe(false);
  });

  test("packets that stop leaving the browser are unheard", () => {
    expect(
      isUnheard(seconds(SAMPLE_WINDOW, () => ({ packetsSent: 400 }))),
    ).toBe(true);
  });

  test("packets that carry only silence are unheard", () => {
    expect(
      isUnheard(seconds(SAMPLE_WINDOW, () => ({ rmsDbfs: SILENCE_DBFS }))),
    ).toBe(true);
  });

  test("one audible moment in the window is enough to count as heard", () => {
    expect(
      isUnheard(
        seconds(SAMPLE_WINDOW, (second) => ({
          rmsDbfs: second === 4 ? -35 : -120,
        })),
      ),
    ).toBe(false);
  });

  test("before the first loudness reading, silence is not assumed", () => {
    expect(isUnheard(seconds(SAMPLE_WINDOW, () => ({ rmsDbfs: null })))).toBe(
      false,
    );
  });

  test("only the most recent stretch is judged", () => {
    const stalledThenFlowing = [
      ...seconds(SAMPLE_WINDOW, () => ({ packetsSent: 0 })),
      ...seconds(SAMPLE_WINDOW),
    ];

    expect(isUnheard(stalledThenFlowing)).toBe(false);
  });
});
