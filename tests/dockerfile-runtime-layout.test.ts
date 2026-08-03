import { describe, expect, test } from "bun:test";
import { join } from "node:path";

async function readRuntimeStage(): Promise<string> {
  const dockerfile = await Bun.file(join(import.meta.dir, "..", "Dockerfile")).text();
  // Match any bun base tag — the image is pinned to a stable release line and
  // gets bumped over time, so hardcoding one tag here would break the split
  // (and silently assert against the whole Dockerfile) on every upgrade.
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
