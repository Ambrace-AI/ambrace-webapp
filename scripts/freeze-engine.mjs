// Records a checksum for every file of the frozen voice engine.
//
// Run `npm run engine:freeze` only when a voice change is intended and tested.
// tests/frozen-engine.test.ts fails whenever a file drifts from this record, so
// an accidental edit (a rename, a reformat, a "tidy-up") cannot slip through.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const MANIFEST = "tests/frozen-engine.json";

const FILES = [
  "lib/hooks/useSessionTimer.ts",
  "lib/hooks/useVivaSession.ts",
  "lib/store/viva-store.ts",
  "lib/telemetry/voice-telemetry.ts",
];
const DIRECTORIES = ["lib/gemini", "lib/hooks/viva"];
const WORKLETS = /^audio-.*\.js$/;

export function frozenFiles() {
  const fromDirectories = DIRECTORIES.flatMap((directory) =>
    readdirSync(directory)
      .filter((name) => statSync(join(directory, name)).isFile())
      .map((name) => `${directory}/${name}`),
  );
  const worklets = readdirSync("public")
    .filter((name) => WORKLETS.test(name))
    .map((name) => `public/${name}`);
  return [...FILES, ...fromDirectories, ...worklets].sort();
}

// Line endings are normalised so Windows and Linux checkouts agree.
export function checksum(path) {
  const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  return createHash("sha256").update(text).digest("hex");
}

export function currentManifest() {
  return Object.fromEntries(
    frozenFiles().map((path) => [path, checksum(path)]),
  );
}

if (process.argv[1]?.endsWith("freeze-engine.mjs")) {
  const manifest = currentManifest();
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Recorded ${Object.keys(manifest).length} files in ${MANIFEST}`);
}
