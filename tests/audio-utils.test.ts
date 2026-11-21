import { describe, expect, test } from "vitest";

import { arrayBufferToBase64, base64ToFloat32 } from "@/lib/gemini/audio-utils";

/** 16-bit little-endian PCM, the format Gemini Live sends and receives. */
function pcm(...samples: number[]): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  samples.forEach((sample, index) => view.setInt16(index * 2, sample, true));
  return buffer;
}

describe("encoding microphone audio for the wire", () => {
  test("bytes become base64", () => {
    expect(arrayBufferToBase64(new Uint8Array([72, 105]).buffer)).toBe("SGk=");
  });

  test("silence of no length is an empty string", () => {
    expect(arrayBufferToBase64(new ArrayBuffer(0))).toBe("");
  });

  test("every byte value survives, including zero and 255", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);

    const decoded = Uint8Array.from(
      atob(arrayBufferToBase64(bytes.buffer)),
      (c) => c.charCodeAt(0),
    );

    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
});

describe("decoding the examiner's audio", () => {
  test("full-scale samples map to exactly -1 and 1", () => {
    const samples = base64ToFloat32(arrayBufferToBase64(pcm(-32768, 0, 32767)));

    expect(Array.from(samples)).toEqual([-1, 0, 1]);
  });

  test("samples are read little-endian, two bytes each", () => {
    // 0x4000 is half of full scale, stored low byte first.
    const samples = base64ToFloat32(
      arrayBufferToBase64(new Uint8Array([0x00, 0x40]).buffer),
    );

    expect(samples).toHaveLength(1);
    expect(samples[0]).toBeCloseTo(0.5, 4);
  });

  test("quiet negative and positive samples keep their sign and size", () => {
    const samples = base64ToFloat32(arrayBufferToBase64(pcm(-16384, 16384)));

    expect(samples[0]).toBeCloseTo(-0.5, 4);
    expect(samples[1]).toBeCloseTo(0.5, 4);
  });

  test("an empty chunk decodes to no samples", () => {
    expect(base64ToFloat32("")).toHaveLength(0);
  });
});
