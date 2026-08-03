import { describe, expect, test } from "bun:test";
import { join } from "node:path";

async function readRuntimeStage(): Promise<string> {
  const dockerfile = await Bun.file(join(import.meta.dir, "..", "Dockerfile")).text();
  // Match any bun base reference — tag and/or digest. Hardcoding one tag meant
  // that pinning the image (canary-slim -> 1.3.14-slim@sha256:…) silently broke
  // the split: `at(-1)` fell back to the whole Dockerfile, so the assertions
  // below matched content from any stage instead of the runtime stage.
  const runtimeStage = dockerfile.split(/\nFROM oven\/bun:\S+\s*\n/).at(-1);

  if (!runtimeStage || runtimeStage === dockerfile) {
    throw new Error("Could not locate the final runtime stage in Dockerfile");
  }

  return runtimeStage;
}

describe("Docker runtime image", () => {
  test("ships frontend version metadata alongside dist assets", async () => {
    const runtimeStage = await readRuntimeStage();

    expect(runtimeStage).toMatch(/COPY --from=frontend-build \/app\/frontend\/dist \.\/frontend\/dist/);
    expect(runtimeStage).toMatch(/COPY --from=frontend-build \/app\/frontend\/package\.json \.\/frontend\/package\.json/);
  });
});
