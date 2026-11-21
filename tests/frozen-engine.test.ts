import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

import { MANIFEST, currentManifest } from "../scripts/freeze-engine.mjs";

const recorded: Record<string, string> = JSON.parse(
  readFileSync(MANIFEST, "utf8"),
);

test("the voice engine matches its recorded checksums", () => {
  const current: Record<string, string> = currentManifest();

  const changed = Object.keys(recorded).filter(
    (path) => current[path] !== undefined && current[path] !== recorded[path],
  );
  const removed = Object.keys(recorded).filter((path) => !(path in current));
  const added = Object.keys(current).filter((path) => !(path in recorded));

  assert.deepEqual(
    { changed, removed, added },
    { changed: [], removed: [], added: [] },
    "The voice engine is frozen. If this change is intended and tested, run `npm run engine:freeze` and commit the new record.",
  );
});

test("the record covers the worklets, the Gemini client and the session hooks", () => {
  const paths = Object.keys(recorded);

  for (const required of [
    "public/audio-worklet-processor.js",
    "public/audio-output-worklet.js",
    "lib/gemini/live-client-sdk.ts",
    "lib/gemini/live-recovery.ts",
    "lib/gemini/transcript-assembler.ts",
    "lib/hooks/viva/audio-pipeline.ts",
    "lib/hooks/useVivaSession.ts",
  ]) {
    assert.ok(paths.includes(required), `${required} is not protected`);
  }
});

test("the session hook no longer depends on Clerk", () => {
  const hook = readFileSync("lib/hooks/useVivaSession.ts", "utf8");

  assert.doesNotMatch(hook, /@clerk/);
  assert.match(hook, /getAuthToken/);
});
