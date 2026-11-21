"use client";

import { useEffect, useState } from "react";

import { voiceTelemetry } from "@/lib/telemetry/voice-telemetry";
import {
  SAMPLE_WINDOW,
  isUnheard,
  type MicrophoneSample,
} from "@/lib/viva/microphone-health";

const SAMPLE_EVERY_MS = 1000;

/**
 * True when it is the student's turn and their microphone has delivered
 * nothing for several seconds. Sampled once a second, and only while
 * `listening`: when the examiner speaks or thinks, silence is expected.
 */
export function useMicrophoneUnheard(listening: boolean): boolean {
  const [unheard, setUnheard] = useState(false);

  useEffect(() => {
    if (!listening) return;
    const samples: MicrophoneSample[] = [];
    const timer = setInterval(() => {
      const snapshot = voiceTelemetry.getSnapshot();
      samples.push({
        packetsSent: snapshot.totalInputPackets,
        rmsDbfs: snapshot.microphoneLevel?.rmsDbfs ?? null,
      });
      if (samples.length > SAMPLE_WINDOW) samples.shift();
      setUnheard(isUnheard(samples));
    }, SAMPLE_EVERY_MS);
    return () => {
      clearInterval(timer);
      // Each turn is judged afresh.
      setUnheard(false);
    };
  }, [listening]);

  return listening && unheard;
}
