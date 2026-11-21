// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useSessionTimer } from "@/lib/hooks/useSessionTimer";
import { useVivaStore } from "@/lib/store/viva-store";
import {
  ConversationState,
  MicrophoneState,
  PlaybackState,
  SessionState,
  type VivaStartResponse,
} from "@/types/viva";

const store = () => useVivaStore.getState();

const STARTED: VivaStartResponse = {
  viva_session_id: "session-1",
  ephemeral_token: "auth_tokens/abc",
  google_model: "gemini-live-test",
  session_duration_minutes: 10,
  voice_name: "Puck",
  vad_profile: "balanced-v1",
  google_api_version: "v1beta",
  token_expires_at: "2026-11-21T10:30:00Z",
  new_session_expires_at: "2026-11-21T10:01:00Z",
  session_deadline_at: "2026-11-21T10:10:00Z",
  session_resumption_enabled: true,
};

beforeEach(() => store().resetSession());
afterEach(() => {
  // Unmount every hook, or timers from one test keep running in the next.
  cleanup();
  vi.useRealTimers();
});

describe("starting a session", () => {
  test("stores what the backend issued and starts the clock at the full duration", () => {
    store().setSessionData(STARTED);

    expect(store()).toMatchObject({
      sessionId: "session-1",
      ephemeralToken: "auth_tokens/abc",
      googleModel: "gemini-live-test",
      voiceName: "Puck",
      vadProfile: "balanced-v1",
      sessionDurationMinutes: 10,
      timeRemaining: 600,
      sessionResumptionEnabled: true,
      connectionStatus: "connecting",
    });
  });

  test("fields an older backend leaves out fall back to safe defaults", () => {
    store().setSessionData({
      viva_session_id: "session-1",
      ephemeral_token: "auth_tokens/abc",
      google_model: "gemini-live-test",
      session_duration_minutes: 5,
      voice_name: "Kore",
    } as VivaStartResponse);

    expect(store()).toMatchObject({
      vadProfile: null,
      googleApiVersion: "v1beta",
      tokenExpiresAt: null,
      sessionDeadlineAt: null,
      sessionResumptionEnabled: false,
    });
  });
});

describe("ending a session", () => {
  test("the live credential is wiped while the session id is kept for the report", () => {
    store().setSessionData(STARTED);

    store().clearLiveCredentials();

    expect(store().ephemeralToken).toBeNull();
    expect(store().tokenExpiresAt).toBeNull();
    expect(store().sessionResumptionEnabled).toBe(false);
    expect(store().connectionStatus).toBe("disconnected");
    expect(store().sessionId).toBe("session-1");
  });

  test("resetting leaves nothing behind for the next session", () => {
    store().setSessionData(STARTED);
    store().addTranscript({ role: "user", text: "Hello", isFinal: true });
    store().setError("Microphone blocked");
    store().setConclusionData({ score: 7, total: 10, feedback: "Good" });
    store().toggleMute();

    store().resetSession();

    expect(store()).toMatchObject({
      sessionId: null,
      ephemeralToken: null,
      transcripts: [],
      error: null,
      conclusionData: null,
      isMuted: false,
      sessionState: SessionState.IDLE,
      timeRemaining: 300,
    });
  });
});

describe("live state", () => {
  test("each kind of state is tracked on its own", () => {
    store().setSessionState(SessionState.ACTIVE);
    store().setMicrophoneState(MicrophoneState.ACTIVE);
    store().setConversationState(ConversationState.SPEAKING);
    store().setPlaybackState(PlaybackState.PLAYING);

    expect(store()).toMatchObject({
      sessionState: SessionState.ACTIVE,
      microphoneState: MicrophoneState.ACTIVE,
      conversationState: ConversationState.SPEAKING,
      playbackState: PlaybackState.PLAYING,
    });
  });

  test("mute flips each time", () => {
    store().toggleMute();
    expect(store().isMuted).toBe(true);
    store().toggleMute();
    expect(store().isMuted).toBe(false);
  });

  test("an error and a conclusion can be set and cleared", () => {
    store().setError("Connection lost");
    store().setConclusionData({ score: 8, total: 10, feedback: "Clear" });
    expect(store().error).toBe("Connection lost");
    expect(store().conclusionData?.score).toBe(8);

    store().setError(null);
    store().setConclusionData(null);
    expect(store().error).toBeNull();
    expect(store().conclusionData).toBeNull();
  });
});

describe("the transcript", () => {
  test("a new line is given its own id and time", () => {
    store().addTranscript({ role: "user", text: "Hello", isFinal: true });
    store().addTranscript({ role: "assistant", text: "Hi", isFinal: true });

    const [first, second] = store().transcripts;
    expect(first.text).toBe("Hello");
    expect(first.id).not.toBe(second.id);
    expect(first.timestamp).toBeGreaterThan(0);
  });

  test("a line that is still being spoken is updated in place, not repeated", () => {
    store().upsertTranscript({
      id: "turn-1",
      role: "user",
      text: "Photo",
      isFinal: false,
    });
    store().upsertTranscript({
      id: "turn-1",
      role: "user",
      text: "Photosynthesis is",
      isFinal: false,
    });

    expect(store().transcripts).toHaveLength(1);
    expect(store().transcripts[0].text).toBe("Photosynthesis is");
  });

  test("updating one line leaves the others alone", () => {
    store().upsertTranscript({
      id: "a",
      role: "user",
      text: "One",
      isFinal: false,
    });
    store().upsertTranscript({
      id: "b",
      role: "user",
      text: "Two",
      isFinal: false,
    });

    store().updateTranscript("a", { isFinal: true });

    expect(store().transcripts.map((line) => line.isFinal)).toEqual([
      true,
      false,
    ]);
  });

  test("updating a line that does not exist changes nothing", () => {
    store().upsertTranscript({
      id: "a",
      role: "user",
      text: "One",
      isFinal: false,
    });

    store().updateTranscript("missing", { text: "Changed" });

    expect(store().transcripts[0].text).toBe("One");
  });
});

describe("the session timer on screen", () => {
  function startAt(seconds: number, minutes = 10) {
    store().setSessionData({ ...STARTED, session_duration_minutes: minutes });
    // No server deadline here, so the clock counts down by itself.
    useVivaStore.setState({ sessionDeadlineAt: null, timeRemaining: seconds });
  }

  test("shows minutes and seconds, and how much of the session is left", () => {
    startAt(125);

    const { result } = renderHook(() => useSessionTimer(() => undefined));

    expect(result.current.formattedTime).toBe("02:05");
    expect(result.current.progress).toBeCloseTo((125 / 600) * 100, 5);
    expect(result.current.timerStatus).toBe("normal");
    expect(result.current.isWarning).toBe(false);
  });

  test("warns in the last two minutes and turns urgent in the last one", () => {
    startAt(120);
    const { result, rerender } = renderHook(() =>
      useSessionTimer(() => undefined),
    );
    expect(result.current.timerStatus).toBe("warning");
    expect(result.current.isWarning).toBe(true);
    expect(result.current.isUrgent).toBe(false);

    act(() => store().setTimeRemaining(60));
    rerender();
    expect(result.current.timerStatus).toBe("urgent");
    expect(result.current.isUrgent).toBe(true);
    expect(result.current.formattedTime).toBe("01:00");
  });

  test("does not tick before the session is active", () => {
    vi.useFakeTimers();
    startAt(300);
    renderHook(() => useSessionTimer(() => undefined));

    act(() => vi.advanceTimersByTime(5_000));

    expect(store().timeRemaining).toBe(300);
  });

  test("ticks once a second while active and calls time when it runs out", () => {
    vi.useFakeTimers();
    startAt(2);
    store().setSessionState(SessionState.ACTIVE);
    const onTimeLimit = vi.fn();
    const { result } = renderHook(() => useSessionTimer(onTimeLimit));

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.formattedTime).toBe("00:01");
    expect(onTimeLimit).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.formattedTime).toBe("00:00");
    expect(onTimeLimit).toHaveBeenCalledTimes(1);
    expect(store().timerWarningShown).toBe(true);
  });

  test("stops ticking when the session leaves the active state or the screen closes", () => {
    vi.useFakeTimers();
    startAt(300);
    store().setSessionState(SessionState.ACTIVE);
    const { unmount } = renderHook(() => useSessionTimer(() => undefined));

    act(() => vi.advanceTimersByTime(2_000));
    expect(store().timeRemaining).toBe(298);

    act(() => store().setSessionState(SessionState.CONCLUDING));
    act(() => vi.advanceTimersByTime(3_000));
    expect(store().timeRemaining).toBe(298);

    unmount();
    act(() => vi.advanceTimersByTime(3_000));
    expect(store().timeRemaining).toBe(298);
  });
});
