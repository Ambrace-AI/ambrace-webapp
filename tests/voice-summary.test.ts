import { afterEach, describe, expect, test, vi } from "vitest";

const snapshot = {
  connectionState: "connected",
  currentTurn: 3,
  totalInputPackets: 1500,
  inputPacketsDropped: 12,
  inputContinuity: {
    dropCounts: {
      worklet_backpressure: 2,
      stale_main: 10,
      forwarding_failure: 0,
      transport_unready: 0,
      send_failure: 0,
    },
    maxCaptureToMainAgeMs: 180,
    maxAcceptedSendIntervalMs: 240,
  },
  microphoneLevel: { rmsDbfs: -42, peakDbfs: -20, clippedSampleRatio: 0 },
  microphoneFormat: { processingSampleRate: 48000 },
  microphoneErrorCode: null,
  totalOutputChunks: 90,
  sessionPlaybackUnderrunCount: 1,
  connectionRetryCount: 0,
  // Present on the real snapshot, and never to be copied into a log.
  recentEvents: [{ name: "server_speech_start" }],
};

vi.mock("@/lib/telemetry/voice-telemetry", () => ({
  voiceTelemetry: { getSnapshot: () => snapshot },
}));

import { logVoiceSummary, summariseVoice } from "@/lib/viva/voice-summary";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("the voice summary", () => {
  test("says how much audio left, how much was lost and why, and how loud it was", () => {
    expect(summariseVoice(snapshot as never)).toEqual({
      connection: "connected",
      turns: 3,
      packetsSent: 1500,
      packetsDropped: 12,
      dropsByReason: snapshot.inputContinuity.dropCounts,
      worstPacketAgeMs: 180,
      worstSendGapMs: 240,
      microphoneRmsDbfs: -42,
      microphoneRateHz: 48000,
      microphoneError: null,
      replyChunks: 90,
      playbackUnderruns: 1,
      reconnects: 0,
    });
  });

  test("copes with a session that never opened the microphone", () => {
    const summary = summariseVoice({
      ...snapshot,
      microphoneLevel: null,
      microphoneFormat: null,
    } as never);

    expect(summary.microphoneRmsDbfs).toBeNull();
    expect(summary.microphoneRateHz).toBeNull();
  });

  test("is written to the console while developing, with the occasion", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logVoiceSummary("viva over");

    expect(info).toHaveBeenCalledWith(
      "[Viva] voice summary (viva over)",
      expect.objectContaining({ packetsSent: 1500 }),
    );
  });

  test("is never written in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logVoiceSummary("viva over");

    expect(info).not.toHaveBeenCalled();
  });
});
