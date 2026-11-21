import { defineConfig } from "vitest/config";

// Based on the Next.js Vitest guide, with three deliberate differences. Each
// was checked against a real component test before it was adopted.
//
// 1. No vite-tsconfig-paths: Vite now reads the "@/..." alias from
//    tsconfig.json itself.
// 2. No @vitejs/plugin-react: Vite compiles JSX on its own. The plugin adds
//    Fast Refresh, which only matters to a dev server, and it pulls in Babel.
// 3. The default environment is Node, not jsdom. The voice-engine tests build
//    their own browser stand-ins (AudioContext, worklets, window) and must not
//    inherit a second one. A component test opts in to a browser by starting
//    with the comment `// @vitest-environment jsdom`.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    // Every spy is undone after each test, so one test cannot leak into the next.
    restoreMocks: true,
  },
});
