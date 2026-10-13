// Tests for the plain-logic files in src/lib. Run with: npx vitest@3 run
// (Kept separate from vite.config.ts so the app's build plugins don't load during tests.)
import { fileURLToPath } from "node:url";

export default {
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
};
