/**
 * Is the student's microphone reaching us?
 *
 * The examiner can only answer what it hears. When it is the student's turn
 * and nothing is arriving, the screen should say so rather than sit on
 * "Listening". Two things count as nothing: no audio packets leaving the
 * browser, or packets that carry only digital silence (a muted or wrong
 * device). Both are judged over several seconds, so a pause to think in a
 * quiet room is not reported the moment it starts.
 */
export type MicrophoneSample = {
  /** Audio packets accepted by the line so far this session. */
  packetsSent: number;
  /** Loudness of the most recent half second, or null before the first reading. */
  rmsDbfs: number | null;
};

/**
 * At or below this the input is digital silence: a muted or disconnected
 * device, which reads -120. A quiet room is not silence. With the browser's
 * noise suppression on, one measured about -84 while the student said nothing.
 */
export const SILENCE_DBFS = -100;
/** How long nothing must arrive before it is worth mentioning. */
export const UNHEARD_AFTER_SECONDS = 8;
/** One sample a second: the window holds its start and its end. */
export const SAMPLE_WINDOW = UNHEARD_AFTER_SECONDS + 1;

export function isUnheard(samples: readonly MicrophoneSample[]): boolean {
  if (samples.length < SAMPLE_WINDOW) return false;
  const window = samples.slice(-SAMPLE_WINDOW);
  const stalled =
    window[window.length - 1].packetsSent === window[0].packetsSent;
  const silent = window.every(
    (sample) => sample.rmsDbfs !== null && sample.rmsDbfs <= SILENCE_DBFS,
  );
  return stalled || silent;
}
