import {
  ConversationState,
  MicrophoneState,
  PlaybackState,
  SessionState,
} from "@/types/viva";

/**
 * The one thing a student needs to know at any moment of a viva: whose turn
 * it is. The voice engine tracks this in several separate pieces; this folds
 * them into a single moment the screen can draw and name.
 */
export type LiveMoment =
  | "connecting"
  | "speaking"
  | "listening"
  | "thinking"
  | "muted"
  | "reconnecting"
  | "concluding"
  | "completed"
  | "error"
  | "leaving";

export type LiveSnapshot = {
  sessionState: SessionState;
  connectionStatus:
    "connecting" | "connected" | "reconnecting" | "disconnected";
  microphoneState: MicrophoneState;
  conversationState: ConversationState;
  playbackState: PlaybackState;
  isMuted: boolean;
};

/**
 * Order matters. An ending or a fault outranks everything; then a dropped
 * line; then what can be heard (the examiner's voice) outranks what is only
 * inferred (thinking, listening).
 */
export function liveMoment(snapshot: LiveSnapshot): LiveMoment {
  switch (snapshot.sessionState) {
    case SessionState.ERROR:
      return "error";
    case SessionState.COMPLETED:
      return "completed";
    case SessionState.CONCLUDING:
      return "concluding";
    case SessionState.STARTING:
      return "connecting";
    case SessionState.IDLE:
      // Only reached once a session has been ended early and the engine is
      // taking the student back home.
      return "leaving";
  }
  if (snapshot.connectionStatus === "reconnecting") return "reconnecting";
  if (snapshot.playbackState === PlaybackState.PLAYING) return "speaking";
  if (snapshot.microphoneState !== MicrophoneState.ACTIVE) return "thinking";
  if (snapshot.isMuted) return "muted";
  if (snapshot.conversationState === ConversationState.THINKING)
    return "thinking";
  return "listening";
}

/** The words under the orbit. Short, present tense, no jargon. */
export const MOMENT_LABELS: Record<LiveMoment, string> = {
  connecting: "Connecting",
  speaking: "Your examiner is speaking",
  listening: "Listening",
  thinking: "Thinking",
  muted: "You are muted",
  reconnecting: "Reconnecting",
  concluding: "Preparing your report",
  completed: "Finished",
  error: "Stopped",
  leaving: "One moment",
};
