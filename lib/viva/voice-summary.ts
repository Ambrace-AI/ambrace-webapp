import {
  voiceTelemetry,
  type DiagnosticsSnapshot,
} from "@/lib/telemetry/voice-telemetry";

/**
 * The few numbers that say whether audio flowed in a viva: how much left the
 * microphone, how much was lost and why, and how loud it was. Counts and
 * timings only. Nothing the student said is ever part of this.
 */
export function summariseVoice(snapshot: DiagnosticsSnapshot) {
  const {
    inputContinuity: input,
    microphoneLevel,
    microphoneFormat,
  } = snapshot;
  return {
    connection: snapshot.connectionState,
    turns: snapshot.currentTurn,
    packetsSent: snapshot.totalInputPackets,
    packetsDropped: snapshot.inputPacketsDropped,
    dropsByReason: { ...input.dropCounts },
    worstPacketAgeMs: input.maxCaptureToMainAgeMs,
    worstSendGapMs: input.maxAcceptedSendIntervalMs,
    microphoneRmsDbfs: microphoneLevel?.rmsDbfs ?? null,
    microphoneRateHz: microphoneFormat?.processingSampleRate ?? null,
    microphoneError: snapshot.microphoneErrorCode,
    replyChunks: snapshot.totalOutputChunks,
    playbackUnderruns: snapshot.sessionPlaybackUnderrunCount,
    reconnects: snapshot.connectionRetryCount,
  };
}

/**
 * While developing, leave one line in the console per viva and one whenever
 * the microphone goes unheard, so a session that "did not listen" can be
 * explained from what happened instead of guessed at.
 */
export function logVoiceSummary(occasion: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    `[Viva] voice summary (${occasion})`,
    summariseVoice(voiceTelemetry.getSnapshot()),
  );
}
